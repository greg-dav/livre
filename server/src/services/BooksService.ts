import {
  type BookFormat,
  type BookVolume,
  type BookSearchResponse,
  type BookSource,
  type SearchScope,
  type SearchSort,
  type SearchResult,
  type SearchResponse,
  type ShelfFilter,
  type ShelfResponse,
  type CreateLogEventResponse,
  type LibraryBookDetail,
  type LibraryResponse,
  type ShelfStatus,
  type LogEventType,
  type RefreshMetadataBody,
  type UpdateLogEntryBody,
} from '@livre/types';
import { db } from '../db';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';
import { type BookCacheProvider } from '../providers/BookCacheProvider';
import { type LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { type ReadingLogRepository } from '../repositories/ReadingLogRepository';
import { toBookVolume, type SourcedBook, type SourcedBookSearchResponse } from '../lib/bookRef';
import { toGoodreadsCsv } from '../lib/goodreadsCsv';

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

  /**
   * Faceted catalog search. The source orders and pages the results; this layer joins each hit
   * against the user's library, derives the shelf-membership counts, then applies the shelf filter.
   * All of it lives here so the client only renders what it's handed.
   */
  async search(
    userId: number,
    query: string,
    scope: SearchScope = 'anything',
    shelf?: ShelfFilter,
    sort: SearchSort = 'relevance',
    startIndex = 0
  ): Promise<SearchResponse> {
    const internal = await this.googleBooks.search(query, scope, { startIndex, sort });
    return this.toFacetedResponse(userId, internal, startIndex, shelf);
  }

  /**
   * Lightweight search for the top-bar preview: a short page of raw source results with no library
   * join, annotation, or faceting. The top bar does its own (instant, cached) library matching, so
   * it doesn't need any of that work done server-side.
   */
  async quickSearch(query: string): Promise<BookSearchResponse> {
    const internal = await this.googleBooks.search(query, 'anything', { maxResults: 10 });
    return { results: internal.results.map(toBookVolume), total: internal.total };
  }

  async getAuthorBooks(
    userId: number,
    name: string,
    sort: SearchSort = 'relevance',
    startIndex = 0
  ): Promise<SearchResponse> {
    // Covers come pre-upgraded from GoogleBooksClient.upgradeCoverUrl, so we no longer need
    // a per-result getById to surface a large thumbnail.
    const internal = await this.googleBooks.searchByAuthor(name, { startIndex, sort });
    return this.toFacetedResponse(userId, internal, startIndex);
  }

  // Annotates a raw source page with the user's library state, counts shelf membership (before any
  // filter, so the facet shows both buckets), applies the optional shelf filter, and computes the
  // next page cursor from the *raw* page size so a filtered page still advances through the source.
  private toFacetedResponse(
    userId: number,
    internal: SourcedBookSearchResponse,
    startIndex: number,
    shelf?: ShelfFilter
  ): SearchResponse {
    const owned = new Map(
      this.libraryBooksRepo.findSnapshotsByUser(userId).map((snap) => [snap.book.bookRef, snap])
    );

    const annotated: SearchResult[] = internal.results.map((book) => {
      const volume = toBookVolume(book);
      const snapshot = owned.get(volume.bookRef);
      // General rule: when the user owns the book, their saved snapshot is the source of truth for
      // every displayed field — they may have edited the title, cover, dates, tags, etc. on their
      // own copy. The source result only stands in for books not yet in the library.
      const display = snapshot?.book ?? volume;
      return {
        ...display,
        libraryBookId: snapshot?.libraryBookId ?? null,
        libraryStatus: snapshot?.status ?? null,
      };
    });

    const shelfCounts = {
      in: annotated.filter((b) => b.libraryStatus !== null).length,
      out: annotated.filter((b) => b.libraryStatus === null).length,
    };

    const results = annotated.filter((b) =>
      shelf === 'in' ? b.libraryStatus !== null : shelf === 'out' ? b.libraryStatus === null : true
    );

    const rawCount = internal.results.length;
    const nextStartIndex =
      rawCount > 0 && startIndex + rawCount < internal.total ? startIndex + rawCount : null;

    return { results, total: internal.total, shelfCounts, nextStartIndex };
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

  updateDescription(userId: number, libraryBookId: number, description: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateDescription(libraryBookId, description);
    return true;
  }

  updateCover(userId: number, libraryBookId: number, url: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateCover(libraryBookId, url);
    return true;
  }

  updateTitle(userId: number, libraryBookId: number, title: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateTitle(libraryBookId, title);
    return true;
  }

  updatePublisher(userId: number, libraryBookId: number, publisher: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updatePublisher(libraryBookId, publisher);
    return true;
  }

  updatePageCount(userId: number, libraryBookId: number, pageCount: number): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updatePageCount(libraryBookId, pageCount);
    return true;
  }

  updatePublishedDate(userId: number, libraryBookId: number, publishedDate: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updatePublishedDate(libraryBookId, publishedDate);
    return true;
  }

  updateLanguage(userId: number, libraryBookId: number, language: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateLanguage(libraryBookId, language);
    return true;
  }

  updateIsbn(userId: number, libraryBookId: number, isbn: string): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.updateIsbn(libraryBookId, isbn);
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

  refreshMetadata(userId: number, libraryBookId: number, fields: RefreshMetadataBody): boolean {
    if (!this.libraryBooksRepo.exists(userId, libraryBookId)) return false;
    this.libraryBooksRepo.refreshMetadata(libraryBookId, fields);
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

  /** Serialise the user's whole library to a Goodreads-shaped CSV string. */
  exportLibraryCsv(userId: number): string {
    return toGoodreadsCsv(this.libraryBooksRepo.findExportRowsByUser(userId));
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
}
