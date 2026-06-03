import { type BookSource, type SearchScope, type SearchSort } from '@livre/types';
import { type SourcedBook, type SourcedBookSearchResponse } from '../lib/bookRef';

export type BookSearchOptions = { startIndex?: number; sort?: SearchSort; maxResults?: number };

/**
 * The contract every book metadata source conforms to. A source owns one {@link BookSource} value
 * and knows how to resolve a single book by its external id within that source. The
 * {@link BookSourceRegistry} keeps these keyed by `source`, so adding a source is a matter of
 * implementing this and registering its adapter in the composition root — no `switch` to extend.
 *
 * This is a domain-owned **port**: concrete adapters (Google Books, Open Library) implement it.
 * Lifecycle and provider concerns (API-key reads, config) stay off this interface; they belong to
 * the concrete adapter, not to the source contract.
 */
export interface BookSourceProvider {
  readonly source: BookSource;
  getById(externalId: string): Promise<SourcedBook>;
}

/**
 * A source that additionally backs the interactive discovery UI (free-text and by-author catalog
 * search). Search lives on this narrower contract rather than {@link BookSourceProvider} because not
 * every source need be searchable. The {@link BookSourceRegistry} hands the search screens the
 * active searchable source while dispatching `getById` through the by-id registry.
 */
export interface SearchableBookSource extends BookSourceProvider {
  search(
    query: string,
    scope?: SearchScope,
    opts?: BookSearchOptions
  ): Promise<SourcedBookSearchResponse>;
  searchByAuthor(name: string, opts?: BookSearchOptions): Promise<SourcedBookSearchResponse>;
}

/**
 * A source that needs per-instance configuration (an API key) before it can be used. Lets consumers
 * gate on availability and validate a candidate key without naming the concrete adapter — only
 * Google Books implements it; Open Library needs no key.
 */
export interface ConfigurableSource {
  validate(apiKey: string): Promise<void>;
  isConfigured(): boolean;
}

/**
 * A source that resolves many books by ISBN in one batched request (used to fill in metadata during
 * import). Keyed by ISBN rather than the stored identity, so it sits apart from
 * {@link BookSourceProvider.getById}.
 */
export interface BatchIsbnSource {
  getByIsbns(isbns: string[]): Promise<Map<string, SourcedBook>>;
}
