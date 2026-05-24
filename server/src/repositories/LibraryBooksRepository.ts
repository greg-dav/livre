import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { libraryBooks, readingLog } from '../db/schema';
import {
  shelfEntrySchema,
  bookVolumeSchema,
  type BookMetadata,
  type BookSource,
  type LibraryBookDetail,
  type ShelfEntry,
  type ShelfStatus,
} from '@livre/types';
import { encodeBookRef } from '../lib/bookRef';

const LATEST_STATUS_EVENT_ID = sql<number>`(
  SELECT id FROM reading_log
  WHERE library_book_id = ${libraryBooks.id}
    AND event IN ('shelved', 'started', 'restarted', 'finished', 'dnf')
  ORDER BY date DESC, id DESC
  LIMIT 1
)`;

const STARTED_DATE_EXPR = sql<string | null>`(
  SELECT date
  FROM reading_log
  WHERE library_book_id = ${libraryBooks.id}
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

// Every column on library_books + the derived shelf-state fields. Used as the single source
// of truth row for both shelf-list and detail-view derivations.
const fullSelect = {
  id: libraryBooks.id,
  source: libraryBooks.source,
  externalId: libraryBooks.externalId,
  title: libraryBooks.title,
  authors: libraryBooks.authors,
  isbn: libraryBooks.isbn,
  description: libraryBooks.description,
  thumbnail: libraryBooks.thumbnail,
  largeThumbnail: libraryBooks.largeThumbnail,
  pageCount: libraryBooks.pageCount,
  publisher: libraryBooks.publisher,
  publishedDate: libraryBooks.publishedDate,
  categories: libraryBooks.categories,
  language: libraryBooks.language,
  rating: libraryBooks.rating,
  review: libraryBooks.review,
  addedDate: libraryBooks.addedDate,
  latestEvent: readingLog.event,
  startedDate: STARTED_DATE_EXPR,
} as const;

type FullRow = {
  id: number;
  source: string | null;
  externalId: string | null;
  title: string;
  authors: string | null;
  isbn: string | null;
  description: string | null;
  thumbnail: string | null;
  largeThumbnail: string | null;
  pageCount: number | null;
  publisher: string | null;
  publishedDate: string | null;
  categories: string | null;
  language: string | null;
  rating: number | null;
  review: string | null;
  addedDate: string;
  latestEvent: string;
  startedDate: string | null;
};

const refFromRow = (source: string | null, externalId: string | null): string | null =>
  source && externalId ? encodeBookRef(source as BookSource, externalId) : null;

const toShelfEntry = (r: FullRow): ShelfEntry =>
  shelfEntrySchema.parse({
    libraryBookId: r.id,
    status: EVENT_TO_STATUS[r.latestEvent],
    startedDate: r.startedDate,
    rating: r.rating,
    review: r.review,
    addedDate: r.addedDate,
    bookRef: refFromRow(r.source, r.externalId),
    title: r.title,
    authors: r.authors ? r.authors.split('|') : [],
    coverUrl: r.largeThumbnail ?? r.thumbnail,
  });

const toBookVolume = (r: FullRow) =>
  bookVolumeSchema.parse({
    bookRef: refFromRow(r.source, r.externalId),
    title: r.title,
    authors: r.authors ? r.authors.split('|') : [],
    isbn: r.isbn ?? undefined,
    description: r.description ?? undefined,
    thumbnail: r.thumbnail ?? undefined,
    largeThumbnail: r.largeThumbnail ?? undefined,
    pageCount: r.pageCount ?? undefined,
    publisher: r.publisher ?? undefined,
    publishedDate: r.publishedDate ?? undefined,
    categories: r.categories ? z.array(z.string()).parse(JSON.parse(r.categories)) : [],
    language: r.language ?? undefined,
  });

export class LibraryBooksRepository {
  findAllByUser(userId: number): ShelfEntry[] {
    const rows = db
      .select(fullSelect)
      .from(libraryBooks)
      .innerJoin(readingLog, eq(readingLog.id, LATEST_STATUS_EVENT_ID))
      .where(eq(libraryBooks.userId, userId))
      .all();
    return rows.map(toShelfEntry);
  }

  /**
   * Single-query detail lookup. Returns null if the book doesn't exist, doesn't belong to the
   * user, or has no source/externalId (manual entries can't be rendered as a BookVolume yet).
   */
  findDetailByLibraryBookId(userId: number, libraryBookId: number): LibraryBookDetail | null {
    const row = db
      .select(fullSelect)
      .from(libraryBooks)
      .innerJoin(readingLog, eq(readingLog.id, LATEST_STATUS_EVENT_ID))
      .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.id, libraryBookId)))
      .get();
    if (!row) return null;
    if (!row.source || !row.externalId) return null;
    return { entry: toShelfEntry(row), book: toBookVolume(row) };
  }

  /** Cheap existence check used by mutations that don't need the full row. */
  exists(userId: number, libraryBookId: number): boolean {
    const row = db
      .select({ id: libraryBooks.id })
      .from(libraryBooks)
      .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.id, libraryBookId)))
      .get();
    return !!row;
  }

  findIdBySource(userId: number, source: BookSource, externalId: string): number | null {
    const r = db
      .select({ id: libraryBooks.id })
      .from(libraryBooks)
      .where(
        and(
          eq(libraryBooks.userId, userId),
          eq(libraryBooks.source, source),
          eq(libraryBooks.externalId, externalId)
        )
      )
      .get();
    return r?.id ?? null;
  }

  /**
   * Copy a metadata snapshot into the user's library. Caller is responsible for ensuring no
   * duplicate exists (use findIdBySource first). Returns the new library_books.id.
   */
  create(userId: number, source: BookSource, externalId: string, metadata: BookMetadata): number {
    const row = db
      .insert(libraryBooks)
      .values({
        userId,
        source,
        externalId,
        title: metadata.title,
        authors: metadata.authors.join('|') || null,
        isbn: metadata.isbn ?? null,
        description: metadata.description ?? null,
        thumbnail: metadata.thumbnail ?? null,
        largeThumbnail: metadata.largeThumbnail ?? null,
        pageCount: metadata.pageCount ?? null,
        publisher: metadata.publisher ?? null,
        publishedDate: metadata.publishedDate ?? null,
        categories: metadata.categories.length > 0 ? JSON.stringify(metadata.categories) : null,
        language: metadata.language ?? null,
      })
      .returning({ id: libraryBooks.id })
      .get();
    if (!row) throw new Error('Failed to create library book');
    return row.id;
  }
}
