import { type BookSource, type ImportSource } from '@livre/types';
import { type SourcedBook } from '../lib/bookRef';
import { RateLimitError } from '../clients/GoogleBooksClient';
import { type GoogleBooksUsageStore } from '../stores/GoogleBooksUsageStore';
import { type ConfigurableSource, type SearchableBookSource } from '../ports/bookSource';
import {
  type ImportCandidate,
  type ImportLookup,
  type ImportLookupSession,
} from '../ports/importLookup';

// Google enforces 100 queries/minute/user; pace dispatches just under that (≈85/min) so a large
// import never trips the per-minute limiter.
const MIN_REQUEST_INTERVAL_MS = 700;

/**
 * Import-lookup strategy for Google Books: one metered request per row, gated by the instance's
 * remaining daily budget. Once the budget is spent — or Google rate-limits a request — the row is
 * `deferred` (left for a re-run after the quota resets) rather than imported unenriched. Dispatches
 * are paced under Google's per-minute cap so a large import doesn't trip it. Available only when an
 * API key is configured; the request itself is charged against the quota inside the adapter, not here.
 */
export class GoogleBooksImportLookup implements ImportLookup {
  readonly source: BookSource;

  constructor(
    private readonly googleBooks: SearchableBookSource & ConfigurableSource,
    private readonly usage: GoogleBooksUsageStore
  ) {
    this.source = googleBooks.source;
  }

  available(): boolean {
    return this.googleBooks.isConfigured();
  }

  describe(): ImportSource {
    return { id: this.source, label: 'Google Books', metered: true, usage: this.usage.snapshot() };
  }

  async begin(): Promise<ImportLookupSession> {
    const pace = this.throttle();
    return {
      resolve: async (row) => {
        if (this.usage.remaining() <= 0) return { status: 'deferred' };
        await pace();
        try {
          return { status: 'resolved', book: await this.lookup(row) };
        } catch (e) {
          if (e instanceof RateLimitError) return { status: 'deferred' };
          throw e;
        }
      },
    };
  }

  // One closure per session: each call sleeps the remainder of the minimum interval between dispatches.
  private throttle(): () => Promise<void> {
    let last = 0;
    return async () => {
      const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - last);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      last = Date.now();
    };
  }

  // By ISBN when present (exact), else by title + lead author. Exactly one request per call so the
  // usage counter stays accurate.
  private async lookup(row: ImportCandidate): Promise<SourcedBook | null> {
    const res = row.isbn
      ? await this.googleBooks.search(row.isbn, 'isbn', { maxResults: 1 })
      : await this.googleBooks.search(
          [row.title, row.authors[0]].filter(Boolean).join(' '),
          'anything',
          { maxResults: 1 }
        );
    return res.results[0] ?? null;
  }
}
