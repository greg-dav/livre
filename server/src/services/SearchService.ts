import {
  type BookVolume,
  type BookSearchResponse,
  type BookSource,
  type SearchScope,
  type SearchSort,
  type SearchResult,
  type SearchResponse,
  type ShelfFilter,
} from '@livre/types';
import { type BookSourceRegistry } from '../registries/BookSourceRegistry';
import { type BookLookupProvider } from '../providers/BookLookupProvider';
import { type LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { toBookVolume, type SourcedBookSearchResponse } from '../lib/bookRef';

/**
 * Read-only book discovery. Works internally in server-side (source, externalId) tuples — the
 * opaque client-side `bookRef` is decoded by the route layer before calling in here, and outbound
 * results are converted back to the client-facing `BookVolume` via `toBookVolume`.
 *
 * Metadata sources are reached through the {@link BookSourceRegistry} (active searchable source for
 * the catalog queries) and {@link BookLookupProvider} (cache-aware by-id fetch for book detail), so
 * adding a source stays a registration in the composition root — no `switch` here to extend.
 */
export class SearchService {
  constructor(
    private readonly sources: BookSourceRegistry,
    private readonly lookup: BookLookupProvider,
    private readonly libraryBooksRepo: LibraryBooksRepository
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
    const internal = await this.sources.searchSource().search(query, scope, { startIndex, sort });
    return this.toFacetedResponse(userId, internal, startIndex, shelf);
  }

  /**
   * Lightweight search for the top-bar preview: a short page of raw source results with no library
   * join, annotation, or faceting. The top bar does its own (instant, cached) library matching, so
   * it doesn't need any of that work done server-side.
   */
  async quickSearch(query: string): Promise<BookSearchResponse> {
    const internal = await this.sources
      .searchSource()
      .search(query, 'anything', { maxResults: 10 });
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
    const internal = await this.sources.searchSource().searchByAuthor(name, { startIndex, sort });
    return this.toFacetedResponse(userId, internal, startIndex);
  }

  async getById(source: BookSource, externalId: string): Promise<BookVolume> {
    return toBookVolume(await this.lookup.fetch(source, externalId));
  }

  // Annotates a raw source page with the user's library state, counts shelf membership (before any
  // filter, so the facet shows both buckets), applies the optional shelf filter, and carries the
  // next page cursor — the source's own when it reports one (it knows its page stride even when it
  // dropped hits), else derived from the raw page size so a filtered page still advances.
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
      internal.nextStartIndex !== undefined
        ? internal.nextStartIndex
        : rawCount > 0 && startIndex + rawCount < internal.total
          ? startIndex + rawCount
          : null;

    return { results, total: internal.total, shelfCounts, nextStartIndex };
  }
}
