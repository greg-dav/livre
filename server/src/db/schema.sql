PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  theme         TEXT    NOT NULL DEFAULT 'roman-light',
  public_key    TEXT,
  private_key   TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);

CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  google_books_id  TEXT UNIQUE,
  open_library_id  TEXT,
  title            TEXT NOT NULL,
  author           TEXT,
  isbn             TEXT,
  description      TEXT,
  cover_url        TEXT,
  page_count       INTEGER,
  publisher        TEXT,
  published_date   TEXT,
  categories       TEXT, -- JSON array
  language         TEXT,
  avg_rating       REAL,
  ratings_count    INTEGER,
  fetched_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_books (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id    INTEGER NOT NULL REFERENCES books(id),
  status     TEXT    NOT NULL CHECK (status IN ('want', 'reading', 'read', 'dnf')),
  rating     INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  review     TEXT,
  added_date TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS reading_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_book_id INTEGER NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
  event        TEXT    NOT NULL CHECK (event IN ('started', 'finished', 'dnf', 'restarted', 'note')),
  note         TEXT,
  date         TEXT    NOT NULL, -- user-supplied; may differ from created_at
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_books_user    ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status  ON user_books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reading_log_ub     ON reading_log(user_book_id);
CREATE INDEX IF NOT EXISTS idx_reading_log_date   ON reading_log(date);
