import {
  type BookFormat,
  type BookSource,
  type CreateLogEventResponse,
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
