import { and, eq } from 'drizzle-orm';
import { type BookSource } from '@livre/types';
import { db, type Tx } from '../db';
import { config } from '../db/schema';

export class ConfigRepository {
  // Per-source setting keys. The source namespaces them, so the key itself is provider-agnostic.
  static readonly API_KEY = 'api_key';
  // Per-instance daily cap on a source's import lookups, and the running counter for today.
  static readonly DAILY_LIMIT = 'daily_limit';
  static readonly USAGE = 'usage';

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
}
