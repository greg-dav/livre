import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  theme: text('theme').notNull().default('roman-light'),
  publicKey: text('public_key'),
  privateKey: text('private_key'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  lastLogin: text('last_login'),
});

export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const bookCache = sqliteTable(
  'book_cache',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    authors: text('authors'),
    isbn: text('isbn'),
    description: text('description'),
    thumbnail: text('thumbnail'),
    largeThumbnail: text('large_thumbnail'),
    pageCount: integer('page_count'),
    publisher: text('publisher'),
    publishedDate: text('published_date'),
    tags: text('tags'),
    fiction: integer('fiction', { mode: 'boolean' }).notNull().default(false),
    genre: text('genre').notNull().default('unknown'),
    language: text('language'),
    cacheExpiresAt: text('cache_expires_at').notNull(),
  },
  (t) => [unique().on(t.source, t.externalId)]
);

export const libraryBooks = sqliteTable('library_books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  source: text('source'),
  externalId: text('external_id'),
  title: text('title').notNull(),
  authors: text('authors'),
  isbn: text('isbn'),
  description: text('description'),
  thumbnail: text('thumbnail'),
  largeThumbnail: text('large_thumbnail'),
  pageCount: integer('page_count'),
  publisher: text('publisher'),
  publishedDate: text('published_date'),
  tags: text('tags'),
  fiction: integer('fiction', { mode: 'boolean' }).notNull().default(false),
  genre: text('genre').notNull().default('unknown'),
  language: text('language'),
  rating: real('rating'),
  review: text('review'),
  addedDate: text('added_date')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const readingLog = sqliteTable('reading_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  libraryBookId: integer('library_book_id')
    .notNull()
    .references(() => libraryBooks.id, { onDelete: 'cascade' }),
  event: text('event', {
    enum: ['shelved', 'started', 'finished', 'dnf', 'restarted', 'note', 'quote', 'format'],
  }).notNull(),
  text: text('text'),
  format: text('format'),
  date: text('date').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const usersRelations = relations(users, ({ many }) => ({
  libraryBooks: many(libraryBooks),
}));

export const libraryBooksRelations = relations(libraryBooks, ({ one, many }) => ({
  user: one(users, { fields: [libraryBooks.userId], references: [users.id] }),
  log: many(readingLog),
}));

export const readingLogRelations = relations(readingLog, ({ one }) => ({
  libraryBook: one(libraryBooks, {
    fields: [readingLog.libraryBookId],
    references: [libraryBooks.id],
  }),
}));
