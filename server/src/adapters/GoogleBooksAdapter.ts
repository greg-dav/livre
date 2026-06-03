import { type BookSource, type SearchScope } from '@livre/types';
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
import { type GoogleBooksClientProvider } from '../providers/GoogleBooksClientProvider';
import { type GoogleBooksUsageStore } from '../stores/GoogleBooksUsageStore';
import {
  type BookSearchOptions,
  type ConfigurableSource,
  type SearchableBookSource,
} from '../ports/bookSource';

/**
 * Adapter translating the Google Books API into our `SourcedBook` domain shape. Implements the
 * searchable-source and configurable-source ports; the wire format lives in {@link GoogleBooksClient}.
 * It owns only translation and metering — {@link GoogleBooksClientProvider} owns config→client
 * lifecycle, and every dispatched request is charged against the per-instance daily quota via
 * {@link GoogleBooksUsageStore}.
 */
export class GoogleBooksAdapter implements SearchableBookSource, ConfigurableSource {
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

  // Charges one unit the moment a request is dispatched (the promise already exists by the time we
  // get it), so failures count too — a 429 or rejected validation still hit the API. The no-key case
  // throws in clients.get() before this runs, so it isn't charged.
  private tracked<T>(request: Promise<T>): Promise<T> {
    this.usage.consume(1);
    return request;
  }

  async validate(apiKey: string): Promise<void> {
    await this.tracked(GoogleBooksClient.validateApiKey(apiKey));
  }

  /** Whether an API key is configured — i.e. whether this source can be offered at all. */
  isConfigured(): boolean {
    return this.clients.isConfigured();
  }
}
