import { z } from 'zod';
import { type SourceUsage } from '@livre/types';
import { ConfigRepository } from '../repositories/ConfigRepository';

const DEFAULT_DAILY_LIMIT = 1000;

const usageRecordSchema = z.object({ date: z.string(), count: z.number().int().nonnegative() });
type UsageRecord = z.infer<typeof usageRecordSchema>;

/**
 * Tracks how many Google Books lookups this Livre instance has spent today, against a configurable
 * per-instance daily cap. Google doesn't expose remaining quota, so we count our own requests and
 * reset at midnight US Pacific — the boundary Google's free quota resets on. State lives in the
 * config table (one JSON row); this is a small persistent store over ConfigRepository, not a
 * lifecycle provider.
 *
 * The count is per instance, not per user: the Google Books API key is the instance's, so its quota
 * is shared by everyone on the instance.
 */
export class GoogleBooksUsageStore {
  constructor(private readonly config: ConfigRepository) {}

  // YYYY-MM-DD in US Pacific, matching Google's quota-reset boundary.
  private today(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  }

  private limit(): number {
    const raw = this.config.get('GOOGLE_BOOKS', ConfigRepository.DAILY_LIMIT);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
  }

  // Today's count; a record from an earlier day (or an unparseable/corrupt one) reads as zero.
  private count(): number {
    const raw = this.config.get('GOOGLE_BOOKS', ConfigRepository.USAGE);
    if (!raw) return 0;
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return 0;
    }
    const parsed = usageRecordSchema.safeParse(json);
    if (!parsed.success || parsed.data.date !== this.today()) return 0;
    return parsed.data.count;
  }

  /** Today's usage against the cap, for the import view's meter. */
  snapshot(): SourceUsage {
    const used = this.count();
    const limit = this.limit();
    return { used: Math.min(used, limit), limit, remaining: Math.max(0, limit - used) };
  }

  remaining(): number {
    return Math.max(0, this.limit() - this.count());
  }

  /** Record that `n` lookups were spent (call after issuing them). */
  consume(n: number): void {
    const record: UsageRecord = { date: this.today(), count: this.count() + n };
    this.config.set('GOOGLE_BOOKS', ConfigRepository.USAGE, JSON.stringify(record));
  }
}
