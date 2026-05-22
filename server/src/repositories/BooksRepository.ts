import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { books } from '../db/schema';
import { type BookSearchResult } from '@livre/types';

export class BooksRepository {
  findByGoogleId(googleId: string) {
    return db.select().from(books).where(eq(books.googleBooksId, googleId)).get() ?? null;
  }

  findByGoogleIdResult(googleId: string): BookSearchResult | null {
    const row = this.findByGoogleId(googleId);
    if (!row) return null;
    return {
      googleId: row.googleBooksId ?? googleId,
      title: row.title,
      authors: row.author ? row.author.split('|') : [],
      publishedDate: row.publishedDate ?? undefined,
      description: row.description ?? undefined,
      thumbnail: row.coverUrl ?? undefined,
      largeThumbnail: row.coverUrl ?? undefined,
      isbn: row.isbn ?? undefined,
      pageCount: row.pageCount ?? undefined,
      publisher: row.publisher ?? undefined,
      categories: row.categories ? z.array(z.string()).parse(JSON.parse(row.categories)) : [],
      language: row.language ?? undefined,
    };
  }

  /**
   * Insert or update a book record. Authors are stored pipe-delimited so the array can be
   * reconstructed without ambiguity. Always stores largeThumbnail as coverUrl for grid quality.
   */
  upsert(data: BookSearchResult): number {
    const values = {
      googleBooksId: data.googleId,
      title: data.title,
      author: data.authors.join('|') || null,
      isbn: data.isbn ?? null,
      description: data.description ?? null,
      coverUrl: data.largeThumbnail ?? null,
      pageCount: data.pageCount ?? null,
      publisher: data.publisher ?? null,
      publishedDate: data.publishedDate ?? null,
      categories: data.categories.length > 0 ? JSON.stringify(data.categories) : null,
      language: data.language ?? null,
      fetchedAt: new Date().toISOString(),
    };

    const row = db
      .insert(books)
      .values(values)
      .onConflictDoUpdate({ target: books.googleBooksId, set: values })
      .returning({ id: books.id })
      .get();

    if (!row) throw new Error('Failed to upsert book');
    return row.id;
  }
}
