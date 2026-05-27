import {
  type BookVolume,
  type BookSearchResponse,
  type BookSource,
  type ShelfResponse,
  type CreateLogEventResponse,
  type LibraryBookDetail,
  type LibraryResponse,
  type ShelfStatus,
  type LogEventType,
} from '@livre/types';
import { db } from '../db';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';
import { type BookCacheProvider } from '../providers/BookCacheProvider';
import { type LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { type ReadingLogRepository } from '../repositories/ReadingLogRepository';
import { toBookVolume, type SourcedBook, type SourcedBookSearchResponse } from '../lib/bookRef';

/**
 * Services work internally in server-side (source, externalId) tuples — the opaque client-side
 * `bookRef` is decoded by the route layer before calling in here. Outbound responses are
 * converted back to the client-facing `BookVolume` (with bookRef) via `toBookVolume`.
 */
export class BooksService {
  constructor(
    private readonly googleBooks: GoogleBooksProvider,
    private readonly bookCache: BookCacheProvider,
    private readonly libraryBooksRepo: LibraryBooksRepository,
    private readonly readingLogRepo: ReadingLogRepository
  ) {}

  async search(query: string): Promise<BookSearchResponse> {
    return this.toResponse(await this.googleBooks.search(query));
  }

  async getAuthorBooks(name: string): Promise<BookSearchResponse> {
    // Covers come pre-upgraded from GoogleBooksClient.upgradeCoverUrl, so we no longer need
    // a per-result getById to surface a large thumbnail.
    return this.toResponse(await this.googleBooks.searchByAuthor(name));
  }

  async getById(source: BookSource, externalId: string): Promise<BookVolume> {
    return toBookVolume(await this.fetchSourced(source, externalId));
  }

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

    const book = await this.fetchSourced(source, externalId);

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
    date?: string
  ): CreateLogEventResponse | null {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return null;

    return db.transaction(() => {
      const resolvedEvent =
        event === 'started' && this.readingLogRepo.shouldPromoteToRestart(libraryBookId)
          ? 'restarted'
          : event;
      const logDate = date ?? new Date().toISOString().slice(0, 10);
      const logId = this.readingLogRepo.insert(libraryBookId, resolvedEvent, logDate);
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

  updateTags(userId: number, libraryBookId: number, tags: string[]): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateTags(libraryBookId, tags);
    return true;
  }

  updateDescription(userId: number, libraryBookId: number, description: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateDescription(libraryBookId, description);
    return true;
  }

  /** Cache-aware lookup that falls through to the source on miss and writes back on the way out. */
  private async fetchSourced(source: BookSource, externalId: string): Promise<SourcedBook> {
    const cached = this.bookCache.get(source, externalId);
    if (cached) return cached;
    const book = await this.fetchFromSource(source, externalId);
    this.bookCache.set(book);
    return book;
  }

  private async fetchFromSource(source: BookSource, externalId: string): Promise<SourcedBook> {
    switch (source) {
      case 'GOOGLE_BOOKS':
        return this.googleBooks.getById(externalId);
    }
  }

  private toResponse(internal: SourcedBookSearchResponse): BookSearchResponse {
    return {
      results: internal.results.map(toBookVolume),
      total: internal.total,
    };
  }
}
