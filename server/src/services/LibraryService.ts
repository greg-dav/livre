import {
  type BookFormat,
  type BookMetadata,
  type BookSource,
  type CreateLogEventResponse,
  type CreateManualBody,
  type LibraryBookDetail,
  type LibraryResponse,
  type ShelfResponse,
  type ShelfStatus,
  type LogEventType,
  type UpdateMetadataBody,
  type UpdateLogEntryBody,
} from '@livre/types';
import { db } from '../db';
import { type BookLookupProvider } from '../providers/BookLookupProvider';
import { type LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { type ReadingLogRepository } from '../repositories/ReadingLogRepository';

// The terminal reading-log event that, atop a `shelved` head, yields each shelf status. `want` needs
// no terminal event — a lone `shelved` already derives to "want". Status is read from the latest
// event, so seeding both keeps the book on the right shelf.
const TERMINAL_EVENT_BY_STATUS: Partial<Record<ShelfStatus, 'started' | 'finished' | 'dnf'>> = {
  reading: 'started',
  read: 'finished',
  dnf: 'dnf',
};

/**
 * The user's owned library: the collection itself, saving a discovered book, the per-book metadata
 * snapshot edits, and the reading-log events nested under each book. Every write the app makes to a
 * user's records flows through here. Saving a discovered book reaches the source through
 * {@link BookLookupProvider} (cache-aware by-id fetch) so this service never touches the registry
 * or cache directly.
 */
export class LibraryService {
  constructor(
    private readonly lookup: BookLookupProvider,
    private readonly libraryBooksRepo: LibraryBooksRepository,
    private readonly readingLogRepo: ReadingLogRepository
  ) {}

  async addToLibrary(
    userId: number,
    source: BookSource,
    externalId: string,
    event: LogEventType,
    date?: string
  ): Promise<CreateLogEventResponse> {
    // Already in this user's library? Just log the event against the existing record.
    const existingId = this.libraryBooksRepo.findIdBySource(userId, source, externalId);
    if (existingId !== null) {
      return db.transaction(() => {
        const resolvedEvent =
          event === 'started' && this.readingLogRepo.shouldPromoteToRestart(existingId)
            ? 'restarted'
            : event;
        const logDate = date ?? new Date().toISOString().slice(0, 10);
        const logId = this.readingLogRepo.insert(existingId, resolvedEvent, logDate);
        return { libraryBookId: existingId, logId };
      });
    }

    const book = await this.lookup.fetch(source, externalId);

    return db.transaction(() => {
      const libraryBookId = this.libraryBooksRepo.create(userId, source, externalId, book);
      const logDate = date ?? new Date().toISOString().slice(0, 10);
      const logId = this.readingLogRepo.insert(libraryBookId, event, logDate);
      return { libraryBookId, logId };
    });
  }

  /**
   * Create a book the user typed in by hand. The row has no upstream source (null source/externalId),
   * so it can't be re-fetched from a provider — it renders purely from this saved snapshot. The
   * reading log is seeded to land the book on the chosen shelf: a `shelved` head plus, for non-want
   * statuses, the terminal event. The supplied cover URL fills both thumbnail fields so list and
   * detail views (which prefer the large one) render the same image.
   */
  createManualBook(userId: number, fields: CreateManualBody): CreateLogEventResponse {
    const metadata: BookMetadata = {
      title: fields.title,
      authors: fields.authors ?? [],
      isbn: fields.isbn,
      description: fields.description,
      thumbnail: fields.coverUrl,
      largeThumbnail: fields.coverUrl,
      pageCount: fields.pageCount,
      publisher: fields.publisher,
      publishedDate: fields.publishedDate,
      language: fields.language,
      tags: [],
      fiction: false,
      genre: 'unknown',
    };

    return db.transaction(() => {
      const libraryBookId = this.libraryBooksRepo.create(userId, null, null, metadata);
      const today = new Date().toISOString().slice(0, 10);
      const shelvedId = this.readingLogRepo.insert(libraryBookId, 'shelved', today);
      const terminal = TERMINAL_EVENT_BY_STATUS[fields.status];
      const logId = terminal
        ? this.readingLogRepo.insert(libraryBookId, terminal, today)
        : shelvedId;
      return { libraryBookId, logId };
    });
  }

  /**
   * Detail view for a library book. Reads from the user's own metadata snapshot — no cache or
   * network call required. Composes the reading log onto the (entry, book) pair so the journal
   * can render the full timeline in a single request. Returns null if the book doesn't exist or
   * doesn't belong to the user.
   */
  getLibraryBook(userId: number, libraryBookId: number): LibraryBookDetail | null {
    const detail = this.libraryBooksRepo.findDetailByLibraryBookId(userId, libraryBookId);
    if (!detail) return null;
    const log = this.readingLogRepo.findByLibraryBookId(libraryBookId);
    return { ...detail, log };
  }

  logEvent(
    userId: number,
    libraryBookId: number,
    event: LogEventType,
    date?: string,
    text?: string,
    format?: BookFormat
  ): CreateLogEventResponse | null {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return null;

    return db.transaction(() => {
      const resolvedEvent =
        event === 'started' && this.readingLogRepo.shouldPromoteToRestart(libraryBookId)
          ? 'restarted'
          : event;
      const logDate = date ?? new Date().toISOString().slice(0, 10);
      const logId = this.readingLogRepo.insert(libraryBookId, resolvedEvent, logDate, text, format);
      return { libraryBookId, logId };
    });
  }

  getShelf(userId: number, status: ShelfStatus): ShelfResponse {
    const all = this.libraryBooksRepo.findAllByUser(userId);
    const entries = all.filter((e) => e.status === status);
    const counts = { want: 0, reading: 0, read: 0, dnf: 0 };
    for (const entry of all) counts[entry.status]++;
    return { entries, counts };
  }

  getLibrary(userId: number): LibraryResponse {
    return this.libraryBooksRepo.findAllByUser(userId);
  }

  getTags(userId: number): string[] {
    return this.libraryBooksRepo.listTags(userId);
  }

  updateTags(userId: number, libraryBookId: number, tags: string[]): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateTags(libraryBookId, tags);
    return true;
  }

  updateRating(userId: number, libraryBookId: number, rating: number | null): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateRating(libraryBookId, rating);
    return true;
  }

  updateReview(userId: number, libraryBookId: number, review: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateReview(libraryBookId, review);
    return true;
  }

  updateMetadata(userId: number, libraryBookId: number, fields: UpdateMetadataBody): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateMetadata(libraryBookId, fields);
    return true;
  }

  updateLogEntry(
    userId: number,
    libraryBookId: number,
    logId: number,
    fields: UpdateLogEntryBody
  ): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    if (!this.readingLogRepo.belongsToLibraryBook(logId, libraryBookId)) return false;
    this.readingLogRepo.update(logId, fields);
    return true;
  }

  deleteLogEntry(userId: number, libraryBookId: number, logId: number): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    if (!this.readingLogRepo.belongsToLibraryBook(logId, libraryBookId)) return false;
    this.readingLogRepo.delete(logId);
    return true;
  }

  /**
   * Reset a book to a pristine, just-shelved state: wipe its entire reading log and clear the
   * rating and review. A fresh `shelved` event is re-seeded so the book keeps a derived status
   * (Want to Read) and stays visible — status is derived from the log via an inner join, so a
   * book with zero events would vanish from every shelf. Tags and the metadata snapshot are kept.
   */
  resetReadingLog(userId: number, libraryBookId: number): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    return db.transaction(() => {
      this.readingLogRepo.deleteAllForBook(libraryBookId);
      const today = new Date().toISOString().slice(0, 10);
      this.readingLogRepo.insert(libraryBookId, 'shelved', today);
      this.libraryBooksRepo.clearRatingAndReview(libraryBookId);
      return true;
    });
  }

  /** Permanently remove a book from the user's library. The FK cascade drops its reading log. */
  removeFromLibrary(userId: number, libraryBookId: number): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.delete(libraryBookId);
    return true;
  }

  /**
   * Wipe the user's entire library — every book, rating, review, and reading-log event. Reading-log
   * rows are dropped first within a transaction rather than leaning on the FK cascade, which isn't
   * reliably enabled. Returns the number of books removed.
   */
  deleteLibrary(userId: number): number {
    return db.transaction(() => {
      this.readingLogRepo.deleteAllForUser(userId);
      return this.libraryBooksRepo.deleteAllByUser(userId);
    });
  }
}
