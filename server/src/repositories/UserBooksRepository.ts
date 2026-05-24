import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { books, readingLog, userBooks } from '../db/schema';
import { shelfEntrySchema, type ShelfEntry, type ShelfStatus } from '@livre/types';

const LATEST_STATUS_EVENT_ID = sql<number>`(
  SELECT id FROM reading_log
  WHERE user_book_id = ${userBooks.id}
    AND event IN ('shelved', 'started', 'restarted', 'finished', 'dnf')
  ORDER BY date DESC, id DESC
  LIMIT 1
)`;

const STARTED_DATE_EXPR = sql<string | null>`(
  SELECT date
  FROM reading_log
  WHERE user_book_id = ${userBooks.id}
    AND event IN ('started', 'restarted')
  ORDER BY date DESC, id DESC
  LIMIT 1
)`;

const EVENT_TO_STATUS: Record<string, ShelfStatus> = {
  shelved: 'want',
  started: 'reading',
  restarted: 'reading',
  finished: 'read',
  dnf: 'dnf',
};

export class UserBooksRepository {
  findAllByUser(userId: number): ShelfEntry[] {
    const rows = db
      .select({
        id: userBooks.id,
        rating: userBooks.rating,
        review: userBooks.review,
        addedDate: userBooks.addedDate,
        googleBooksId: books.googleBooksId,
        title: books.title,
        authorRaw: books.author,
        coverUrl: books.coverUrl,
        latestEvent: readingLog.event,
        startedDate: STARTED_DATE_EXPR,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .innerJoin(readingLog, eq(readingLog.id, LATEST_STATUS_EVENT_ID))
      .where(eq(userBooks.userId, userId))
      .all();

    return rows.map((r) =>
      shelfEntrySchema.parse({
        userBookId: r.id,
        status: EVENT_TO_STATUS[r.latestEvent],
        startedDate: r.startedDate,
        rating: r.rating,
        review: r.review,
        addedDate: r.addedDate,
        googleId: r.googleBooksId,
        title: r.title,
        authors: r.authorRaw ? r.authorRaw.split('|') : [],
        coverUrl: r.coverUrl,
      })
    );
  }

  findByUserBookId(userId: number, userBookId: number): ShelfEntry | null {
    const r = db
      .select({
        id: userBooks.id,
        rating: userBooks.rating,
        review: userBooks.review,
        addedDate: userBooks.addedDate,
        googleBooksId: books.googleBooksId,
        title: books.title,
        authorRaw: books.author,
        coverUrl: books.coverUrl,
        latestEvent: readingLog.event,
        startedDate: STARTED_DATE_EXPR,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .innerJoin(readingLog, eq(readingLog.id, LATEST_STATUS_EVENT_ID))
      .where(and(eq(userBooks.userId, userId), eq(userBooks.id, userBookId)))
      .get();

    if (!r) return null;
    return shelfEntrySchema.parse({
      userBookId: r.id,
      status: EVENT_TO_STATUS[r.latestEvent],
      startedDate: r.startedDate,
      rating: r.rating,
      review: r.review,
      addedDate: r.addedDate,
      googleId: r.googleBooksId,
      title: r.title,
      authors: r.authorRaw ? r.authorRaw.split('|') : [],
      coverUrl: r.coverUrl,
    });
  }

  findOrCreate(userId: number, bookId: number): number {
    const existing = db
      .select({ id: userBooks.id })
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, bookId)))
      .get();
    if (existing) return existing.id;

    const row = db
      .insert(userBooks)
      .values({ userId, bookId })
      .returning({ id: userBooks.id })
      .get();
    if (!row) throw new Error('Failed to create user book');
    return row.id;
  }

  remove(userId: number, bookId: number): void {
    db.delete(userBooks)
      .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, bookId)))
      .run();
  }
}
