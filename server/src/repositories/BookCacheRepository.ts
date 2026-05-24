import { z } from 'zod';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '../db';
import { bookCache } from '../db/schema';
import { type BookSource } from '@livre/types';
import { type SourcedBook } from '../lib/bookRef';

/**
 * Raw CRUD over the book_cache table. TTL semantics live in BookCacheProvider — this layer is
 * unaware of expiry; callers must pass a cacheExpiresAt for writes and check expiry on reads
 * if they care. Returns server-internal SourcedBook (with source + externalId); the route
 * layer converts to client-facing BookVolume (with opaque bookRef) at the API boundary.
 */
export class BookCacheRepository {
  findBySource(source: BookSource, externalId: string): SourcedBook | null {
    const row = db
      .select()
      .from(bookCache)
      .where(and(eq(bookCache.source, source), eq(bookCache.externalId, externalId)))
      .get();
    if (!row) return null;
    return this.toBook(row);
  }

  isExpired(source: BookSource, externalId: string, now: string): boolean {
    const row = db
      .select({ expires: bookCache.cacheExpiresAt })
      .from(bookCache)
      .where(and(eq(bookCache.source, source), eq(bookCache.externalId, externalId)))
      .get();
    if (!row) return true;
    return row.expires < now;
  }

  upsert(book: SourcedBook, cacheExpiresAt: string): void {
    const values = {
      source: book.source,
      externalId: book.externalId,
      title: book.title,
      authors: book.authors.join('|') || null,
      isbn: book.isbn ?? null,
      description: book.description ?? null,
      thumbnail: book.thumbnail ?? null,
      largeThumbnail: book.largeThumbnail ?? null,
      pageCount: book.pageCount ?? null,
      publisher: book.publisher ?? null,
      publishedDate: book.publishedDate ?? null,
      categories: book.categories.length > 0 ? JSON.stringify(book.categories) : null,
      language: book.language ?? null,
      cacheExpiresAt,
    };
    db.insert(bookCache)
      .values(values)
      .onConflictDoUpdate({ target: [bookCache.source, bookCache.externalId], set: values })
      .run();
  }

  deleteExpired(now: string): number {
    const result = db.delete(bookCache).where(lt(bookCache.cacheExpiresAt, now)).run();
    return result.changes;
  }

  private toBook(row: typeof bookCache.$inferSelect): SourcedBook {
    return {
      source: row.source as BookSource,
      externalId: row.externalId,
      title: row.title,
      authors: row.authors ? row.authors.split('|') : [],
      isbn: row.isbn ?? undefined,
      description: row.description ?? undefined,
      thumbnail: row.thumbnail ?? undefined,
      largeThumbnail: row.largeThumbnail ?? undefined,
      pageCount: row.pageCount ?? undefined,
      publisher: row.publisher ?? undefined,
      publishedDate: row.publishedDate ?? undefined,
      categories: row.categories ? z.array(z.string()).parse(JSON.parse(row.categories)) : [],
      language: row.language ?? undefined,
    };
  }
}
