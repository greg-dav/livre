import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { env } from '../env';
import * as schema from './schema';

mkdirSync(env.DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(env.DATA_DIR, 'livre.db'));

// schema.sql is the alpha baseline (all CREATE TABLE IF NOT EXISTS). Post-baseline schema changes
// add an idempotent migration step below, each gated on a pragma_table_info check.
const ddl = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
sqlite.exec(ddl);

export const db = drizzle(sqlite, { schema });

// The transaction callback receives BetterSQLiteTransaction, which differs from typeof db
export type Tx = Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
