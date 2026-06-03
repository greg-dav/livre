import createError from 'http-errors';
import { type BookSource } from '@livre/types';
import { OpenLibraryClient } from '../clients/OpenLibraryClient';
import { type SourcedBook } from '../lib/bookRef';
import { type BookSourceProvider, type BatchIsbnSource } from '../ports/bookSource';

/**
 * Adapter translating the Open Library API into our `SourcedBook` domain shape; the wire format
 * lives in {@link OpenLibraryClient}. Open Library needs no API key, so the client is stateless and
 * held as a single instance.
 *
 * An Open Library book's `externalId` is its edition OLID, so {@link getById} resolves by OLID
 * (the {@link BookSourceProvider} port). The batched {@link getByIsbns} satisfies the
 * {@link BatchIsbnSource} port — import resolves many ISBNs per request (keyed by ISBN, not the
 * stored identity).
 */
export class OpenLibraryAdapter implements BookSourceProvider, BatchIsbnSource {
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
