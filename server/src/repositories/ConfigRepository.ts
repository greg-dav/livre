import { and, eq } from 'drizzle-orm';
import { bookSourceSchema, type BookSource } from '@livre/types';
import { db, type Tx } from '../db';
import { config } from '../db/schema';

export class ConfigRepository {
  // Per-source setting keys. The source namespaces them, so the key itself is provider-agnostic.
  static readonly API_KEY = 'api_key';
  // Per-instance daily cap on a source's import lookups, and the running counter for today.
  static readonly DAILY_LIMIT = 'daily_limit';
  static readonly USAGE = 'usage';
  // Each source's rank in the instance-wide metadata-source priority order (0 = highest). One row
  // per source under the same (source, key) model, so the order generalises to any number of
  // sources rather than a single preferred flag. Sources with no row sort after ranked ones.
  static readonly PRIORITY = 'priority';

  get(source: BookSource, key: string): string | undefined {
    return db
      .select({ value: config.value })
      .from(config)
      .where(and(eq(config.source, source), eq(config.key, key)))
      .get()?.value;
  }

  set(source: BookSource, key: string, value: string, tx?: Tx): void {
    (tx ?? db)
      .insert(config)
      .values({ source, key, value })
      .onConflictDoUpdate({ target: [config.source, config.key], set: { value } })
      .run();
  }

  /** Each source's stored priority rank (0 = highest). Sources without a stored rank are absent. */
  getPriorities(): Map<BookSource, number> {
    const rows = db
      .select({ source: config.source, value: config.value })
      .from(config)
      .where(eq(config.key, ConfigRepository.PRIORITY))
      .all();
    const out = new Map<BookSource, number>();
    for (const row of rows) {
      const parsed = bookSourceSchema.safeParse(row.source);
      const rank = Number(row.value);
      if (parsed.success && Number.isFinite(rank)) out.set(parsed.data, rank);
    }
    return out;
  }

  /** Persist the priority order, ranking each source by its position (0-based) and atomically
   * replacing any previous order. */
  setPriorities(order: BookSource[]): void {
    db.transaction((tx) => {
      tx.delete(config).where(eq(config.key, ConfigRepository.PRIORITY)).run();
      order.forEach((source, rank) => {
        tx.insert(config)
          .values({ source, key: ConfigRepository.PRIORITY, value: String(rank) })
          .run();
      });
    });
  }
}
