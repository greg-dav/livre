import { type BookSource, type SearchScope, type SearchSort } from '@livre/types';
import { type SourcedBook, type SourcedBookSearchResponse } from '../lib/bookRef';

export type BookSearchOptions = { startIndex?: number; sort?: SearchSort; maxResults?: number };

/**
 * The contract every book metadata source conforms to. A source owns one {@link BookSource} value
 * and knows how to resolve a single book by its external id within that source. BooksService keeps
 * a registry of these keyed by `source`, so adding a provider is a matter of implementing this and
 * registering it in the composition root — no `switch` to extend.
 *
 * Provider lifecycle concerns (API-key caching, config invalidation) stay off this interface; they
 * belong to the concrete provider, not to the source contract.
 */
export interface BookSourceProvider {
  readonly source: BookSource;
  getById(externalId: string): Promise<SourcedBook>;
}

/**
 * A source that additionally backs the interactive discovery UI (free-text and by-author catalog
 * search). Not every source can search — Open Library is import-only enrichment — so search lives
 * on this narrower contract rather than {@link BookSourceProvider}. BooksService is injected with a
 * single searchable source for the search screens while dispatching `getById` through the registry.
 */
export interface SearchableBookSource extends BookSourceProvider {
  search(
    query: string,
    scope?: SearchScope,
    opts?: BookSearchOptions
  ): Promise<SourcedBookSearchResponse>;
  searchByAuthor(name: string, opts?: BookSearchOptions): Promise<SourcedBookSearchResponse>;
}
