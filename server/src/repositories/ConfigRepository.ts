import { z } from 'zod';
import db from '../db';

const rowSchema = z.object({ value: z.string() });

export class ConfigRepository {
  static readonly GOOGLE_BOOKS_API_KEY = 'google_books_api_key';

  private readonly query = {
    get: db.prepare('SELECT value FROM config WHERE key = ?'),
  };

  private readonly mutation = {
    set: db.prepare(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ),
  };

  get(key: string): string | undefined {
    const raw = this.query.get.get(key);
    return raw !== undefined ? rowSchema.parse(raw).value : undefined;
  }

  set(key: string, value: string): void {
    this.mutation.set.run(key, value);
  }
}
