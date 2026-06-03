PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  theme         TEXT    NOT NULL DEFAULT 'roman-light',
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);

-- Per-source instance settings (API key, daily limit, usage counter). Keyed by (source, key) so
-- each external source owns its own namespace rather than baking the source into the key name.
CREATE TABLE IF NOT EXISTS config (
  source TEXT NOT NULL CHECK (source IN ('GOOGLE_BOOKS', 'OPEN_LIBRARY')),
  key    TEXT NOT NULL,
  value  TEXT NOT NULL,
  PRIMARY KEY (source, key)
);

-- Transient cache of book metadata fetched from external sources (Google Books, etc.).
-- Shared across users; entries auto-expire and are swept at startup.
-- Never referenced by a foreign key — adding a book to a library copies metadata into
-- library_books rather than referencing this row.
CREATE TABLE IF NOT EXISTS book_cache (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  source           TEXT NOT NULL CHECK (source IN ('GOOGLE_BOOKS', 'OPEN_LIBRARY')),
  external_id      TEXT NOT NULL,
  title            TEXT NOT NULL,
  authors          TEXT,           -- pipe-delimited
  isbn             TEXT,
  description      TEXT,
  thumbnail        TEXT,
  large_thumbnail  TEXT,
  page_count       INTEGER,
  publisher        TEXT,
  published_date   TEXT,
  tags             TEXT,           -- JSON array of normalized tags
  fiction          INTEGER NOT NULL DEFAULT 0,
  genre            TEXT    NOT NULL DEFAULT 'unknown',
  language         TEXT,
  cache_expires_at TEXT NOT NULL,
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_book_cache_expires ON book_cache(cache_expires_at);

-- A user's permanent record of a book. Owns its own metadata snapshot so users can edit
-- their copy independently and so we never depend on a cache hit (or even on the original
-- source still being reachable) to render a library book.
CREATE TABLE IF NOT EXISTS library_books (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- provider-agnostic provenance; both nullable to support future manual entries
  source         TEXT CHECK (source IS NULL OR source IN ('GOOGLE_BOOKS', 'OPEN_LIBRARY')),
  external_id    TEXT,
  -- metadata snapshot (user-owned copy)
  title            TEXT NOT NULL,
  authors          TEXT,           -- pipe-delimited
  isbn             TEXT,
  description      TEXT,
  thumbnail        TEXT,
  large_thumbnail  TEXT,
  page_count       INTEGER,
  publisher        TEXT,
  published_date   TEXT,
  tags             TEXT,           -- JSON array of normalized tags
  fiction          INTEGER NOT NULL DEFAULT 0,
  genre            TEXT    NOT NULL DEFAULT 'unknown',
  language         TEXT,
  -- user fields
  rating         REAL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review         TEXT,
  added_date     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_books_source
  ON library_books(user_id, source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_library_books_user ON library_books(user_id);

CREATE TABLE IF NOT EXISTS reading_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  library_book_id INTEGER NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  event           TEXT    NOT NULL CHECK (event IN ('shelved', 'started', 'finished', 'dnf', 'restarted', 'note', 'quote', 'format')),
  text            TEXT,
  format          TEXT    CHECK (format IS NULL OR format IN ('physical', 'ereader', 'audio')),
  date            TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reading_log_lb   ON reading_log(library_book_id);
CREATE INDEX IF NOT EXISTS idx_reading_log_date ON reading_log(date);
