import createError from 'http-errors';
import { type BookSource } from '@livre/types';
import { OpenLibraryClient } from '../clients/OpenLibraryClient';
import { type SourcedBook } from '../lib/bookRef';
import { type BookSourceProvider } from './BookSourceProvider';

/**
 * Lifecycle wrapper over OpenLibraryClient, mirroring GoogleBooksProvider so services depend on a
 * provider rather than a client. Open Library needs no API key, so the client is stateless and the
 * provider only memoizes a single instance — there's no config to invalidate.
 *
 * An Open Library book's `externalId` is its edition OLID, so {@link getById} resolves by OLID. It
 * satisfies the {@link BookSourceProvider} contract; the batched {@link getByIsbns} stays public for
 * import enrichment, which resolves many ISBNs per request (keyed by ISBN, not the stored identity).
 */
export class OpenLibraryProvider implements BookSourceProvider {
  readonly source: BookSource = 'OPEN_LIBRARY';
  private readonly client = new OpenLibraryClient();

  async getById(externalId: string): Promise<SourcedBook> {
    const book = await this.client.getByOlid(externalId);
    if (!book) throw createError(404, 'Book not found');
    return book;
  }

  async getByIsbns(isbns: string[]): Promise<Map<string, SourcedBook>> {
    return this.client.getByIsbns(isbns);
  }
}
