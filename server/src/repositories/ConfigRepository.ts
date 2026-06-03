import { eq } from 'drizzle-orm';
import { db, type Tx } from '../db';
import { config } from '../db/schema';

export class ConfigRepository {
  static readonly GOOGLE_BOOKS_API_KEY = 'google_books_api_key';
  // Per-instance daily cap on Google Books import lookups, and the running counter for today.
  static readonly GOOGLE_BOOKS_DAILY_LIMIT = 'google_books_daily_limit';
  static readonly GOOGLE_BOOKS_USAGE = 'google_books_usage';

  get(key: string): string | undefined {
    return db.select({ value: config.value }).from(config).where(eq(config.key, key)).get()?.value;
  }

  set(key: string, value: string, tx?: Tx): void {
    (tx ?? db)
      .insert(config)
      .values({ key, value })
      .onConflictDoUpdate({ target: config.key, set: { value } })
      .run();
  }
}
