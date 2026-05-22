import { and, count, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { books, userBooks } from '../db/schema';
import {
  shelfEntrySchema,
  shelfCountsSchema,
  libraryResponseSchema,
  type ShelfEntry,
  type ShelfCounts,
  type LibraryResponse,
  type ShelfStatus,
} from '@livre/types';

export class UserBooksRepository {
  findByUserAndStatus(userId: number, status: ShelfStatus): ShelfEntry[] {
    const raw = db
      .select({
        userBookId: userBooks.id,
        status: userBooks.status,
        rating: userBooks.rating,
        review: userBooks.review,
        addedDate: userBooks.addedDate,
        googleId: books.googleBooksId,
        title: books.title,
        authorRaw: books.author,
        coverUrl: books.coverUrl,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(and(eq(userBooks.userId, userId), eq(userBooks.status, status)))
      .all();

    return z.array(shelfEntrySchema).parse(
      raw.map((r) => ({
        userBookId: r.userBookId,
        status: r.status,
        rating: r.rating,
        review: r.review,
        addedDate: r.addedDate,
        googleId: r.googleId,
        title: r.title,
        authors: r.authorRaw ? r.authorRaw.split('|') : [],
        coverUrl: r.coverUrl,
      }))
    );
  }

  countsByUser(userId: number): ShelfCounts {
    const rows = db
      .select({ status: userBooks.status, total: count() })
      .from(userBooks)
      .where(eq(userBooks.userId, userId))
      .groupBy(userBooks.status)
      .all();

    const counts = { want: 0, reading: 0, read: 0, dnf: 0 };
    for (const row of rows) {
      counts[row.status] = row.total;
    }
    return shelfCountsSchema.parse(counts);
  }

  findAllByUser(userId: number): LibraryResponse {
    const raw = db
      .select({
        userBookId: userBooks.id,
        status: userBooks.status,
        rating: userBooks.rating,
        review: userBooks.review,
        addedDate: userBooks.addedDate,
        googleId: books.googleBooksId,
        title: books.title,
        authorRaw: books.author,
        coverUrl: books.coverUrl,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(and(eq(userBooks.userId, userId), isNotNull(books.googleBooksId)))
      .all();

    return libraryResponseSchema.parse(
      raw.map((r) => ({
        userBookId: r.userBookId,
        status: r.status,
        rating: r.rating,
        review: r.review,
        addedDate: r.addedDate,
        googleId: r.googleId,
        title: r.title,
        authors: r.authorRaw ? r.authorRaw.split('|') : [],
        coverUrl: r.coverUrl,
      }))
    );
  }

  upsert(userId: number, bookId: number, status: ShelfStatus): number {
    const row = db
      .insert(userBooks)
      .values({ userId, bookId, status })
      .onConflictDoUpdate({
        target: [userBooks.userId, userBooks.bookId],
        set: { status },
      })
      .returning({ id: userBooks.id })
      .get();

    if (!row) throw new Error('Failed to upsert user book');
    return row.id;
  }

  remove(userId: number, bookId: number): void {
    db.delete(userBooks)
      .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, bookId)))
      .run();
  }
}
