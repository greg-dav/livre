import createError from 'http-errors';
import { type BookSource } from '@livre/types';
import { type BookSourceRegistry } from '../registries/BookSourceRegistry';
import { type BookCacheProvider } from './BookCacheProvider';
import { type SourcedBook } from '../lib/bookRef';

/**
 * Cache-aware resolution of a single book by (source, externalId): returns the cached copy when one
 * is fresh, otherwise fetches from the source registered for that {@link BookSource} and writes the
 * result back to the cache on the way out. Shared by SearchService (book detail) and LibraryService
 * (saving a discovered book) so both reach the same read-through path without depending on one
 * another. A book referencing a source with no registered adapter reads as not found.
 */
export class BookLookupProvider {
  constructor(
    private readonly sources: BookSourceRegistry,
    private readonly bookCache: BookCacheProvider
  ) {}

  async fetch(source: BookSource, externalId: string): Promise<SourcedBook> {
    const cached = this.bookCache.get(source, externalId);
    if (cached) return cached;
    const provider = this.sources.providerFor(source);
    if (!provider) throw createError(404, 'Book not found');
    const book = await provider.getById(externalId);
    this.bookCache.set(book);
    return book;
  }
}
