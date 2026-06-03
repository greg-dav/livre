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
import {
  type BatchIsbnSource,
  type ConfigurableSource,
  type SearchableBookSource,
} from '../ports/bookSource';
import { type GoogleBooksUsageStore } from '../stores/GoogleBooksUsageStore';
import { type ImportRow, type LibraryFormat } from '../formats/LibraryFormat';

// Cap how many per-row failures travel back to the client; the count is always exact, the list is
// just a sample so a pathological file can't return a megabyte of error text.
const MAX_ERRORS = 50;

/**
 * Moves a user's whole library in and out of Livre through pluggable {@link LibraryFormat} adapters.
 * Holds the format registry (keyed by id) and is the single place that knows how to turn a parsed
 * {@link ImportRow} into a persisted book: enrich by ISBN via Open Library, copy into library_books,
 * and synthesize the reading-log events that give the book its shelf status.
 *
 * Per the repo's layering rules it composes repositories, source ports, and the usage store directly
 * rather than calling other services — the create-and-seed-log flow overlaps BooksService.addToLibrary
 * but is duplicated here because import seeds multiple events at historical dates rather than one
 * event at "now".
 */
export class LibraryTransferService {
  private readonly formats: Map<string, LibraryFormat>;

  constructor(
    formats: LibraryFormat[],
    private readonly libraryBooksRepo: LibraryBooksRepository,
    private readonly readingLogRepo: ReadingLogRepository,
    private readonly openLibrary: BatchIsbnSource,
    private readonly googleBooks: SearchableBookSource & ConfigurableSource,
    private readonly googleUsage: GoogleBooksUsageStore
  ) {
    this.formats = new Map(formats.map((f) => [f.id, f]));
  }

  /**
   * Metadata sources offered to the import view. Open Library is always available (free, no key,
   * unlimited); Google Books appears only when an API key is configured, and carries today's
   * per-instance usage so the client can show the meter and warn before a large import.
   */
  listImportSources(): ImportSource[] {
    const options: ImportSource[] = [
      { id: 'OPEN_LIBRARY', label: 'Open Library', metered: false, usage: null },
    ];
    if (this.googleBooks.isConfigured()) {
      options.push({
        id: 'GOOGLE_BOOKS',
        label: 'Google Books',
        metered: true,
        usage: this.googleUsage.snapshot(),
      });
    }
    return options;
  }

  /** Client-facing list of available formats; drives the import/export modals. */
  listFormats(): LibraryFormatInfo[] {
    return [...this.formats.values()].map((f) => ({
      id: f.id,
      label: f.label,
      fileExtension: f.fileExtension,
      capabilities: f.capabilities,
    }));
  }

  /** Serialize the user's whole library through a format. Returns the file body and its metadata. */
  export(
    userId: number,
    formatId: string
  ): { content: string; mimeType: string; filename: string } {
    const format = this.requireFormat(formatId, 'export');
    const content = format.serialize(this.libraryBooksRepo.findExportRowsByUser(userId));
    const date = new Date().toISOString().slice(0, 10);
    return {
      content,
      mimeType: format.mimeType,
      filename: `livre-library-${date}.${format.fileExtension}`,
    };
  }

  /**
   * Parse an import file and add its books, enriching metadata from the chosen source. A row is
   * skipped if it matches a book already in the library (by normalized ISBN, title/author, or the
   * enriched source id) or an earlier row in the same file. With Google Books, lookups are gated by
   * the instance's remaining daily budget: once it's spent, the rest are `deferred` (left for a
   * re-run after the quota resets) rather than imported without enrichment. Existing rows are never
   * touched.
   */
  async import(
    userId: number,
    formatId: string,
    content: string,
    source: BookSource
  ): Promise<ImportResult> {
    const format = this.requireFormat(formatId, 'import');
    if (source === 'GOOGLE_BOOKS' && !this.googleBooks.isConfigured()) {
      throw createError(400, 'Google Books is not configured on this instance');
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
    // Open Library resolves the whole file in a few batched requests up front; Google Books is
    // per-book and quota-gated, so it's looked up inside the loop instead.
    const olEnrichment =
      source === 'OPEN_LIBRARY' ? await this.enrichViaOpenLibrary(valid, existingIsbns) : null;

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

        let enriched: SourcedBook | null;
        if (olEnrichment) {
          enriched = row.isbn ? (olEnrichment.get(row.isbn) ?? null) : null;
        } else {
          // Google Books: stop importing once the daily budget is spent, leaving the rest for a
          // later run. Deferred books aren't persisted, so a re-run resumes where this one stopped.
          // The lookup itself counts against the quota inside GoogleBooksAdapter — not here.
          if (this.googleUsage.remaining() <= 0) {
            deferred++;
            continue;
          }
          enriched = await this.lookupGoogle(row);
        }

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

  // One Google Books lookup for a row: by ISBN when present (exact), else by title + lead author.
  // Exactly one request per call so the usage counter stays accurate.
  private async lookupGoogle(row: ImportRow): Promise<SourcedBook | null> {
    const res = row.isbn
      ? await this.googleBooks.search(row.isbn, 'isbn', { maxResults: 1 })
      : await this.googleBooks.search(
          [row.title, row.authors[0]].filter(Boolean).join(' '),
          'anything',
          { maxResults: 1 }
        );
    return res.results[0] ?? null;
  }

  // Resolve Open Library metadata for the books worth enriching, keyed by each row's canonical ISBN.
  // Both ISBN variants a row carries go into one batched lookup so an edition indexed under only one
  // of them still resolves. No cache: dedup-before-lookup already limits each ISBN to one fetch, and
  // its identity is now the OLID, so an ISBN-keyed cache could never hit.
  private async enrichViaOpenLibrary(
    valid: { row: ImportRow }[],
    existingIsbns: Set<string>
  ): Promise<Map<string, SourcedBook>> {
    // Every ISBN variant worth resolving: present, distinct, and not already owned.
    const candidates = _(valid)
      .flatMap(({ row }) => [row.isbn, row.isbnAlt])
      .compact()
      .uniq()
      .reject((isbn) => existingIsbns.has(isbn))
      .value();

    const known = candidates.length > 0 ? await this.openLibrary.getByIsbns(candidates) : new Map();

    // Map back to each row's canonical ISBN; the first variant that resolved wins.
    const result = new Map<string, SourcedBook>();
    for (const { row } of valid) {
      if (!row.isbn || result.has(row.isbn)) continue;
      const hit = known.get(row.isbn) ?? (row.isbnAlt ? known.get(row.isbnAlt) : undefined);
      if (hit) result.set(row.isbn, hit);
    }
    return result;
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

  private requireFormat(formatId: string, capability: 'import' | 'export'): LibraryFormat {
    const format = this.formats.get(formatId);
    if (!format) throw createError(404, `Unknown format: ${formatId}`);
    if (!format.capabilities[capability]) {
      throw createError(400, `Format ${formatId} does not support ${capability}`);
    }
    return format;
  }
}
