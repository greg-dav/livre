import { type BookSource } from '@livre/types';
import { type SourcedBook } from '../lib/bookRef';
import { type BookCacheRepository } from '../repositories/BookCacheRepository';

const DEFAULT_TTL_DAYS = 7;
const DEFAULT_SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * TTL-aware façade over BookCacheRepository. Services depend on this provider, not the
 * repository, so the "is this entry still fresh?" decision lives in exactly one place. The
 * cache is shared across users and decoupled from library_books — saving a book to a library
 * copies the metadata snapshot rather than referencing this row, so eviction is always safe.
 *
 * Sweep cadence is shorter than the TTL on purpose: with a 7-day TTL and a 24h sweep, an
 * expired row lives at most ~24h after expiry before deletion, keeping the table close to
 * the working set. Reads still check expiry inline, so stale rows are never returned.
 */
export class BookCacheProvider {
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(private readonly repo: BookCacheRepository) {}

  /** Returns the cached book if present and unexpired; otherwise null. */
  get(source: BookSource, externalId: string): SourcedBook | null {
    const now = new Date().toISOString();
    if (this.repo.isExpired(source, externalId, now)) return null;
    return this.repo.findBySource(source, externalId);
  }

  /** Upsert with TTL. Default is 7 days for search-fetched metadata. */
  set(book: SourcedBook, ttlDays: number = DEFAULT_TTL_DAYS): void {
    const expires = new Date(Date.now() + ttlDays * 86_400_000).toISOString();
    this.repo.upsert(book, expires);
  }

  /** Delete all expired rows immediately. Returns the number of rows deleted. */
  sweep(): number {
    return this.repo.deleteExpired(new Date().toISOString());
  }

  /**
   * Run sweep once now and then on a fixed interval (default: every 24 hours). The timer is
   * unref'd so it never holds the process open. Idempotent — calling twice replaces the
   * existing schedule.
   */
  startPeriodicSweep(intervalMs: number = DEFAULT_SWEEP_INTERVAL_MS): void {
    this.stopPeriodicSweep();
    const tick = () => {
      const deleted = this.sweep();
      if (deleted > 0) console.log(`Swept ${deleted} expired book_cache entries`);
    };
    tick();
    this.sweepTimer = setInterval(tick, intervalMs);
    this.sweepTimer.unref();
  }

  stopPeriodicSweep(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }
}
