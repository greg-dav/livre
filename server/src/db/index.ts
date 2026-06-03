import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import { env } from '../env';
import * as schema from './schema';

mkdirSync(env.DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(env.DATA_DIR, 'livre.db'));

// A `source` CHECK constraint can't be widened with ALTER in SQLite, so a table whose CHECK
// predates a BookSource addition (e.g. OPEN_LIBRARY) must be rebuilt. Detect via its stored DDL.
const ddlRowSchema = z.object({ sql: z.string() });
const sourceCheckIsStale = (table: string): boolean => {
  const row = ddlRowSchema.safeParse(
    sqlite.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  );
  return (
    row.success && row.data.sql.includes('GOOGLE_BOOKS') && !row.data.sql.includes('OPEN_LIBRARY')
  );
};

// book_cache is transient — a stale one is simply dropped here and recreated fresh by schema.sql.
if (sourceCheckIsStale('book_cache')) sqlite.exec('DROP TABLE book_cache');

const ddl = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
sqlite.exec(ddl);

// Idempotent column migrations for databases that predate these columns being in schema.sql
const userColumns = sqlite
  .prepare("SELECT name FROM pragma_table_info('users')")
  .all()
  .map((r) => (r as { name: string }).name);
if (!userColumns.includes('theme'))
  sqlite.exec("ALTER TABLE users ADD COLUMN theme TEXT NOT NULL DEFAULT 'roman-light'");
if (!userColumns.includes('token_version'))
  sqlite.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0');
// Drop the never-read RSA keypair columns — they stored a plaintext private key per user. This
// purges that secret from databases predating its removal.
if (userColumns.includes('public_key')) sqlite.exec('ALTER TABLE users DROP COLUMN public_key');
if (userColumns.includes('private_key')) sqlite.exec('ALTER TABLE users DROP COLUMN private_key');

// config gained a `source` column and a (source, key) primary key. Databases that predate it stored
// Google Books settings under `google_books_*` keys with no source; rebuild in place, remapping
// those rows to (GOOGLE_BOOKS, api_key|daily_limit|usage). The admin's saved API key is carried
// across, so no reconfiguration is needed after upgrade.
const configColumns = sqlite
  .prepare("SELECT name FROM pragma_table_info('config')")
  .all()
  .map((r) => (r as { name: string }).name);
if (!configColumns.includes('source')) {
  sqlite.exec(`
    CREATE TABLE config_new (
      source TEXT NOT NULL CHECK (source IN ('GOOGLE_BOOKS', 'OPEN_LIBRARY')),
      key    TEXT NOT NULL,
      value  TEXT NOT NULL,
      PRIMARY KEY (source, key)
    );
    INSERT INTO config_new (source, key, value)
      SELECT 'GOOGLE_BOOKS',
             CASE key
               WHEN 'google_books_api_key' THEN 'api_key'
               WHEN 'google_books_daily_limit' THEN 'daily_limit'
               WHEN 'google_books_usage' THEN 'usage'
               ELSE key
             END,
             value
      FROM config;
    DROP TABLE config;
    ALTER TABLE config_new RENAME TO config;
  `);
}

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

// library_books holds user data, so widen its source CHECK by rebuilding in place (copy → drop →
// rename) rather than dropping it. FKs are toggled off so reading_log's references survive the swap
// (row ids are preserved). Runs after the column migrations above so every column exists to copy.
if (sourceCheckIsStale('library_books')) {
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE library_books_new (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source         TEXT CHECK (source IS NULL OR source IN ('GOOGLE_BOOKS', 'OPEN_LIBRARY')),
      external_id    TEXT,
      title            TEXT NOT NULL,
      authors          TEXT,
      isbn             TEXT,
      description      TEXT,
      thumbnail        TEXT,
      large_thumbnail  TEXT,
      page_count       INTEGER,
      publisher        TEXT,
      published_date   TEXT,
      tags             TEXT,
      fiction          INTEGER NOT NULL DEFAULT 0,
      genre            TEXT    NOT NULL DEFAULT 'unknown',
      language         TEXT,
      rating         REAL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
      review         TEXT,
      added_date     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO library_books_new (id, user_id, source, external_id, title, authors, isbn,
      description, thumbnail, large_thumbnail, page_count, publisher, published_date, tags, fiction,
      genre, language, rating, review, added_date)
      SELECT id, user_id, source, external_id, title, authors, isbn, description, thumbnail,
        large_thumbnail, page_count, publisher, published_date, tags, fiction, genre, language,
        rating, review, added_date FROM library_books;
    DROP TABLE library_books;
    ALTER TABLE library_books_new RENAME TO library_books;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_library_books_source
      ON library_books(user_id, source, external_id)
      WHERE source IS NOT NULL AND external_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_library_books_user ON library_books(user_id);
    PRAGMA foreign_keys = ON;
  `);
}

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
