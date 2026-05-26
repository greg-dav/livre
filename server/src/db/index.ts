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

const bookCacheColumns = sqlite
  .prepare("SELECT name FROM pragma_table_info('book_cache')")
  .all()
  .map((r) => (r as { name: string }).name);
if (bookCacheColumns.includes('categories') && !bookCacheColumns.includes('tags'))
  sqlite.exec('ALTER TABLE book_cache RENAME COLUMN categories TO tags');
if (!bookCacheColumns.includes('fiction'))
  sqlite.exec('ALTER TABLE book_cache ADD COLUMN fiction INTEGER NOT NULL DEFAULT 0');
if (!bookCacheColumns.includes('genre'))
  sqlite.exec("ALTER TABLE book_cache ADD COLUMN genre TEXT NOT NULL DEFAULT 'unknown'");

const libraryBooksColumns = sqlite
  .prepare("SELECT name FROM pragma_table_info('library_books')")
  .all()
  .map((r) => (r as { name: string }).name);
if (libraryBooksColumns.includes('categories') && !libraryBooksColumns.includes('tags'))
  sqlite.exec('ALTER TABLE library_books RENAME COLUMN categories TO tags');
if (!libraryBooksColumns.includes('fiction'))
  sqlite.exec('ALTER TABLE library_books ADD COLUMN fiction INTEGER NOT NULL DEFAULT 0');
if (!libraryBooksColumns.includes('genre'))
  sqlite.exec("ALTER TABLE library_books ADD COLUMN genre TEXT NOT NULL DEFAULT 'unknown'");

export const db = drizzle(sqlite, { schema });

// The transaction callback receives BetterSQLiteTransaction, which differs from typeof db
export type Tx = Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
