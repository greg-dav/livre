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

// Migrate reading_log: rename note→text, add format column, add quote/format event types.
// Sentinel: presence of the text column indicates the migration has already run.
const readingLogColumns = sqlite
  .prepare("SELECT name FROM pragma_table_info('reading_log')")
  .all()
  .map((r) => (r as { name: string }).name);
if (!readingLogColumns.includes('text')) {
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE reading_log_new (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      library_book_id INTEGER NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
      event           TEXT    NOT NULL CHECK (event IN ('shelved', 'started', 'finished', 'dnf', 'restarted', 'note', 'quote', 'format')),
      text            TEXT,
      format          TEXT    CHECK (format IS NULL OR format IN ('physical', 'ereader', 'audio')),
      date            TEXT    NOT NULL,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO reading_log_new (id, library_book_id, event, text, date, created_at)
      SELECT id, library_book_id, event, note, date, created_at FROM reading_log;
    DROP TABLE reading_log;
    ALTER TABLE reading_log_new RENAME TO reading_log;
    CREATE INDEX IF NOT EXISTS idx_reading_log_lb   ON reading_log(library_book_id);
    CREATE INDEX IF NOT EXISTS idx_reading_log_date ON reading_log(date);
    PRAGMA foreign_keys = ON;
  `);
}

export const db = drizzle(sqlite, { schema });

// The transaction callback receives BetterSQLiteTransaction, which differs from typeof db
export type Tx = Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
