import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { env } from '../env';
import * as schema from './schema';

mkdirSync(env.DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(env.DATA_DIR, 'livre.db'));

const ddl = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
sqlite.exec(ddl);

// Idempotent column migrations for databases that predate these columns being in schema.sql
const userColumns = sqlite
  .prepare("SELECT name FROM pragma_table_info('users')")
  .all()
  .map((r) => (r as { name: string }).name);
if (!userColumns.includes('public_key'))
  sqlite.exec('ALTER TABLE users ADD COLUMN public_key TEXT');
if (!userColumns.includes('private_key'))
  sqlite.exec('ALTER TABLE users ADD COLUMN private_key TEXT');

export const db = drizzle(sqlite, { schema });

// The transaction callback receives BetterSQLiteTransaction, which differs from typeof db
export type Tx = Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
