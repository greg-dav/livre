import { type BookSource, type SearchScope } from '@livre/types';
import { GoogleBooksClient, RateLimitError } from '../clients/GoogleBooksClient';
import { type GoogleBooksClientProvider } from '../providers/GoogleBooksClientProvider';
import { type GoogleBooksUsageStore } from '../stores/GoogleBooksUsageStore';
import {
  type BookSearchOptions,
  type ConfigurableSource,
  type MeteredSource,
  type SearchableBookSource,
} from '../ports/bookSource';

/**
 * Adapter translating the Google Books API into our `SourcedBook` domain shape. Implements the
 * searchable-, configurable-, and metered-source ports; the wire format lives in
 * {@link GoogleBooksClient}. It owns only translation and metering — {@link GoogleBooksClientProvider}
 * owns config→client lifecycle, and every dispatched request is charged against the per-instance
 * daily quota via {@link GoogleBooksUsageStore}.
 */
export class GoogleBooksAdapter implements SearchableBookSource, ConfigurableSource, MeteredSource {
  readonly source: BookSource = 'GOOGLE_BOOKS';

  constructor(
    private readonly clients: GoogleBooksClientProvider,
    private readonly usage: GoogleBooksUsageStore
  ) {}

  // The trailing `client` param defaults to a freshly-resolved client, so the no-key 503 is raised
  // in the header (before the body) and each method body just speaks to a ready client. The param is
  // beyond the port contract — callers never pass it — but it keeps construction out of the bodies
  // and lets tests inject a stub client.
  async search(
    query: string,
    scope: SearchScope = 'anything',
    opts: BookSearchOptions = {},
    client: GoogleBooksClient = this.clients.get()
  ) {
    return this.tracked(client.search(query, scope, opts));
  }

  async searchByAuthor(
    name: string,
    opts: BookSearchOptions = {},
    client: GoogleBooksClient = this.clients.get()
  ) {
    return this.tracked(client.searchByAuthor(name, opts));
  }

  async getById(id: string, client: GoogleBooksClient = this.clients.get()) {
    return this.tracked(client.getById(id));
  }

  // Charge one unit per request Google served: a 404/5xx counts (it reached the API), a 429 doesn't —
  // Google never charges rate-limited requests against the daily quota, so neither do we.
  private async tracked<T>(request: Promise<T>): Promise<T> {
    try {
      const result = await request;
      this.usage.consume(1);
      return result;
    } catch (e) {
      if (!(e instanceof RateLimitError)) this.usage.consume(1);
      throw e;
    }
  }

  async validate(apiKey: string): Promise<void> {
    await this.tracked(GoogleBooksClient.validateApiKey(apiKey));
  }

  // Reset usage only when the key actually changed — a rotated key starts a fresh daily quota.
  applyApiKey(apiKey: string): void {
    if (this.clients.setApiKey(apiKey)) this.usage.reset();
  }

  /** Whether an API key is configured — i.e. whether this source can be offered at all. */
  isConfigured(): boolean {
    return this.clients.isConfigured();
  }

  /** Whether any of today's per-instance quota is left to serve a request. */
  hasBudget(): boolean {
    return this.usage.remaining() > 0;
  }
}
