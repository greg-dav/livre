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

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  googleBooksId: text('google_books_id').unique(),
  openLibraryId: text('open_library_id'),
  title: text('title').notNull(),
  author: text('author'),
  isbn: text('isbn'),
  description: text('description'),
  coverUrl: text('cover_url'),
  pageCount: integer('page_count'),
  publisher: text('publisher'),
  publishedDate: text('published_date'),
  categories: text('categories'), // JSON array
  language: text('language'),
  avgRating: real('avg_rating'),
  ratingsCount: integer('ratings_count'),
  fetchedAt: text('fetched_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const userBooks = sqliteTable(
  'user_books',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id),
    rating: integer('rating'),
    review: text('review'),
    addedDate: text('added_date')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [unique().on(t.userId, t.bookId)]
);

export const readingLog = sqliteTable('reading_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userBookId: integer('user_book_id')
    .notNull()
    .references(() => userBooks.id, { onDelete: 'cascade' }),
  event: text('event', {
    enum: ['shelved', 'started', 'finished', 'dnf', 'restarted', 'note'],
  }).notNull(),
  note: text('note'),
  date: text('date').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const usersRelations = relations(users, ({ many }) => ({
  userBooks: many(userBooks),
}));

export const booksRelations = relations(books, ({ many }) => ({
  userBooks: many(userBooks),
}));

export const userBooksRelations = relations(userBooks, ({ one, many }) => ({
  user: one(users, { fields: [userBooks.userId], references: [users.id] }),
  book: one(books, { fields: [userBooks.bookId], references: [books.id] }),
  log: many(readingLog),
}));

export const readingLogRelations = relations(readingLog, ({ one }) => ({
  userBook: one(userBooks, { fields: [readingLog.userBookId], references: [userBooks.id] }),
}));
