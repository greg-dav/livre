import createError from 'http-errors';
import { type BookSource, type SearchScope } from '@livre/types';
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { type GoogleBooksUsageProvider } from './GoogleBooksUsageProvider';
import { type BookSearchOptions, type SearchableBookSource } from './BookSourceProvider';

export class GoogleBooksProvider implements SearchableBookSource {
  readonly source: BookSource = 'GOOGLE_BOOKS';

  constructor(
    private readonly config: ConfigRepository,
    private readonly usage: GoogleBooksUsageProvider
  ) {}

  async search(query: string, scope: SearchScope = 'anything', opts: BookSearchOptions = {}) {
    return this.tracked(this.client().search(query, scope, opts));
  }

  async searchByAuthor(name: string, opts: BookSearchOptions = {}) {
    return this.tracked(this.client().searchByAuthor(name, opts));
  }

  async getById(id: string) {
    return this.tracked(this.client().getById(id));
  }

  // Charges one unit the moment a request is dispatched (the promise already exists by the time we
  // get it), so failures count too — a 429 or rejected validation still hit the API. The no-key case
  // throws in client() before this runs, so it isn't charged.
  private tracked<T>(request: Promise<T>): Promise<T> {
    this.usage.consume(1);
    return request;
  }

  async validate(apiKey: string): Promise<void> {
    await this.tracked(GoogleBooksClient.validateApiKey(apiKey));
  }

  /** Whether an API key is configured — i.e. whether this source can be offered at all. */
  isConfigured(): boolean {
    return !!this.config.get(ConfigRepository.GOOGLE_BOOKS_API_KEY);
  }

  // Built fresh from config each call: construction is just capturing the key, so there's nothing
  // worth caching — and reading config every time means a key change takes effect immediately, with
  // no invalidation to remember.
  private client(): GoogleBooksClient {
    const apiKey = this.config.get(ConfigRepository.GOOGLE_BOOKS_API_KEY);
    if (!apiKey) throw createError(503, 'Google Books API key not configured');
    return new GoogleBooksClient(apiKey);
  }
}
