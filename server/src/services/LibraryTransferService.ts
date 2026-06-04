import _ from 'lodash';
import createError from 'http-errors';
import {
  type BookMetadata,
  type BookSource,
  type ImportSource,
  type ImportResult,
  type LibraryFormat as LibraryFormatInfo,
  type ShelfStatus,
} from '@livre/types';
import { db } from '../db';
import { type SourcedBook } from '../lib/bookRef';
import { titleAuthorKey } from '../lib/bookSignature';
import { type LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { type ReadingLogRepository } from '../repositories/ReadingLogRepository';
import { type BookSourceRegistry } from '../registries/BookSourceRegistry';
import { type FormatRegistry } from '../registries/FormatRegistry';
import { type ImportRow } from '../formats/LibraryFormat';

// Cap how many per-row failures travel back to the client; the count is always exact, the list is
// just a sample so a pathological file can't return a megabyte of error text.
const MAX_ERRORS = 50;

/**
 * Moves a user's whole library in and out of Livre through pluggable library formats. It's the
 * single place that knows how to turn a parsed {@link ImportRow} into a persisted book: enrich it
 * through the chosen source's import-lookup, copy into library_books, and synthesize the reading-log
 * events that give the book its shelf status.
 *
 * It asks the {@link FormatRegistry} for a format and the {@link BookSourceRegistry} for the
 * import-lookup strategy of the chosen source, so it never learns whether that source batches by
 * ISBN, is metered, or defers. Per the repo's layering rules it composes repositories and registries
 * directly rather than calling other services — the create-and-seed-log flow overlaps
 * LibraryService.addToLibrary but is duplicated here because import seeds multiple events at historical
 * dates rather than one event at "now".
 */
export class LibraryTransferService {
  constructor(
    private readonly formats: FormatRegistry,
    private readonly libraryBooksRepo: LibraryBooksRepository,
    private readonly readingLogRepo: ReadingLogRepository,
    private readonly sources: BookSourceRegistry
  ) {}

  /**
   * Metadata sources offered to the import view: those usable right now. Open Library is always
   * available (free, no key, unlimited); Google Books appears only when an API key is configured,
   * carrying today's per-instance usage so the client can show the meter and warn before a large
   * import. The registry owns this list.
   */
  listImportSources(): ImportSource[] {
    return this.sources.importSources();
  }

  /** Client-facing list of available formats; drives the import/export modals. */
  listFormats(): LibraryFormatInfo[] {
    return this.formats.list();
  }

  /** Serialize the user's whole library through a format. Returns the file body and its metadata. */
  export(
    userId: number,
    formatId: string
  ): { content: string; mimeType: string; filename: string } {
    const format = this.formats.require(formatId, 'export');
    const content = format.serialize(this.libraryBooksRepo.findExportRowsByUser(userId));
    const date = new Date().toISOString().slice(0, 10);
    return {
      content,
      mimeType: format.mimeType,
      filename: `livre-library-${date}.${format.fileExtension}`,
    };
  }

  /**
   * Parse an import file and add its books, enriching metadata through the chosen source's
   * import-lookup. A row is skipped if it matches a book already in the library (by normalized ISBN,
   * title/author, or the enriched source id) or an earlier row in the same file. The lookup may
   * `defer` a row (a metered source out of budget): deferred rows aren't persisted, so a re-run
   * resumes where this one stopped. Existing rows are never touched.
   */
  async import(
    userId: number,
    formatId: string,
    content: string,
    source: BookSource
  ): Promise<ImportResult> {
    const format = this.formats.require(formatId, 'import');
    const lookup = this.sources.lookupFor(source);
    if (!lookup || !lookup.available()) {
      throw createError(400, `Source ${source} is not available for import on this instance`);
    }
    const rows = format.parse(content);

    const errors: ImportResult['errors'] = [];
    let imported = 0;
    let skipped = 0;
    let deferred = 0;

    // Split parsed rows into importable ones and failures. rowNum is the 1-based record position
    // (not a file line — records may span multiple lines), and the service stays format-agnostic.
    // A row with no title can't become a book.
    const [valid, invalid] = _.partition(
      rows.map((row, i) => ({ row, rowNum: i + 1 })),
      ({ row }) => row.title.trim() !== ''
    );
    let failed = invalid.length;
    for (const { rowNum } of _.take(invalid, MAX_ERRORS)) {
      errors.push({ row: rowNum, message: 'Missing title' });
    }

    // Two dedup keys against the existing library: normalized ISBN (the robust cross-provider key)
    // and a title/author signature for rows that carry no ISBN, so a re-import stays idempotent.
    const existingIsbns = new Set(this.libraryBooksRepo.findIsbnsByUser(userId));
    const existingKeys = new Set(this.libraryBooksRepo.findTitleAuthorKeysByUser(userId));

    // Hand the lookup only the rows it could enrich — those not already in the library — so a batch
    // source never re-fetches owned editions. The strategy decides how to resolve them; the service
    // stays blind to whether that's an up-front batch or per-row metered calls.
    const owned = ({ row }: { row: ImportRow }) =>
      (row.isbn != null && existingIsbns.has(row.isbn)) ||
      existingKeys.has(titleAuthorKey(row.title, row.authors));
    const session = await lookup.begin(valid.filter((entry) => !owned(entry)).map((e) => e.row));

    const importedIsbns = new Set<string>();
    const importedKeys = new Set<string>();
    for (const { row, rowNum } of valid) {
      try {
        const key = titleAuthorKey(row.title, row.authors);
        if ((row.isbn != null && existingIsbns.has(row.isbn)) || existingKeys.has(key)) {
          skipped++;
          continue;
        }
        // A duplicate of an earlier row in the same file: keep the first copy, silently drop the
        // rest. The book still lands in the library, so it isn't reported as skipped or failed.
        if ((row.isbn != null && importedIsbns.has(row.isbn)) || importedKeys.has(key)) {
          continue;
        }

        const outcome = await session.resolve(row);
        if (outcome.status === 'deferred') {
          deferred++;
          continue;
        }
        const enriched = outcome.book;

        if (
          enriched &&
          this.libraryBooksRepo.findIdBySource(userId, enriched.source, enriched.externalId) !==
            null
        ) {
          skipped++;
          continue;
        }

        this.persist(userId, row, enriched);
        imported++;
        if (row.isbn) importedIsbns.add(row.isbn);
        importedKeys.add(key);
      } catch (e) {
        failed++;
        if (errors.length < MAX_ERRORS) {
          errors.push({ row: rowNum, message: e instanceof Error ? e.message : 'Import failed' });
        }
      }
    }

    return { imported, skipped, failed, deferred, errors };
  }

  // Create the library row (enriched metadata overlaid by the user's own CSV facts), apply rating
  // and review, and seed the reading log — all in one transaction so a book never lands half-shelved.
  private persist(userId: number, row: ImportRow, enriched: SourcedBook | null): void {
    const source = enriched?.source ?? null;
    const externalId = enriched?.externalId ?? null;
    const metadata = this.buildMetadata(row, enriched);

    db.transaction(() => {
      const libraryBookId = this.libraryBooksRepo.create(
        userId,
        source,
        externalId,
        metadata,
        row.addedDate
      );
      if (row.rating !== undefined) this.libraryBooksRepo.updateRating(libraryBookId, row.rating);
      if (row.review !== undefined) this.libraryBooksRepo.updateReview(libraryBookId, row.review);
      this.seedLog(libraryBookId, row);
    });
  }

  // The user's catalogued values (title, authors, the fields they recorded) win over the enrichment;
  // the source fills the gaps and supplies what the CSV never had (cover, description, genre). Tags
  // are the exception — the user's custom shelves and the source's subjects are unioned, since both
  // are genuinely useful and a Goodreads export rarely carries any tags of its own.
  private buildMetadata(row: ImportRow, enriched: SourcedBook | null): BookMetadata {
    return {
      title: row.title.trim() || enriched?.title || row.title,
      authors: row.authors.length > 0 ? row.authors : (enriched?.authors ?? []),
      isbn: row.isbn ?? enriched?.isbn,
      publisher: row.publisher ?? enriched?.publisher,
      pageCount: row.pageCount ?? enriched?.pageCount,
      publishedDate: row.publishedDate ?? enriched?.publishedDate,
      description: enriched?.description,
      thumbnail: enriched?.thumbnail,
      largeThumbnail: enriched?.largeThumbnail,
      language: enriched?.language,
      tags: _.union(row.tags, enriched?.tags ?? []),
      fiction: enriched?.fiction ?? false,
      genre: enriched?.genre ?? 'unknown',
    };
  }

  // Synthesize the minimal log that yields the right shelf: a `shelved` head plus the terminal event
  // for non-want statuses. Status derives from the latest event (date desc, id desc), so the shelved
  // date is clamped to never fall after the terminal date — otherwise it'd outrank it and read back
  // as "want".
  private seedLog(libraryBookId: number, row: ImportRow): void {
    const terminal: Partial<
      Record<ShelfStatus, { event: 'started' | 'finished' | 'dnf'; date: string }>
    > = {
      reading: { event: 'started', date: row.addedDate },
      read: { event: 'finished', date: row.dateRead ?? row.addedDate },
      dnf: { event: 'dnf', date: row.addedDate },
    };
    const end = terminal[row.status];
    const shelvedDate = end && end.date < row.addedDate ? end.date : row.addedDate;
    this.readingLogRepo.insert(libraryBookId, 'shelved', shelvedDate);
    if (end) this.readingLogRepo.insert(libraryBookId, end.event, end.date);
  }
}
