import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { libraryBooks, readingLog } from '../db/schema';
import {
  shelfEntrySchema,
  bookVolumeSchema,
  bookGenreSchema,
  type BookMetadata,
  type BookSource,
  type BookVolume,
  type LibraryBookDetail,
  type ShelfEntry,
  type ShelfStatus,
} from '@livre/types';
import { encodeBookRef } from '../lib/bookRef';
import { type ExportBook } from '../lib/goodreadsCsv';

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

const DATE_READ_EXPR = sql<string | null>`(
  SELECT date
  FROM reading_log
  WHERE library_book_id = ${libraryBooks.id}
    AND event = 'finished'
  ORDER BY date DESC, id DESC
  LIMIT 1
)`;

const READ_COUNT_EXPR = sql<number>`(
  SELECT COUNT(*)
  FROM reading_log
  WHERE library_book_id = ${libraryBooks.id}
    AND event = 'finished'
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
  tags: libraryBooks.tags,
  fiction: libraryBooks.fiction,
  genre: libraryBooks.genre,
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
  tags: string | null;
  fiction: boolean;
  genre: string;
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
    tags: r.tags ? z.array(z.string()).parse(JSON.parse(r.tags)) : [],
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
    tags: r.tags ? z.array(z.string()).parse(JSON.parse(r.tags)) : [],
    fiction: r.fiction,
    genre: bookGenreSchema.parse(r.genre),
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
   * Every owned book as its full saved metadata snapshot, for joining against search results so
   * the user's edited copy (title, cover, dates, …) is what gets displayed. Same rows as
   * findAllByUser, mapped to BookVolume instead of the lighter ShelfEntry; manual entries with no
   * source/externalId are skipped since they can't match a source result.
   */
  findSnapshotsByUser(
    userId: number
  ): { libraryBookId: number; status: ShelfStatus; book: BookVolume }[] {
    const rows = db
      .select(fullSelect)
      .from(libraryBooks)
      .innerJoin(readingLog, eq(readingLog.id, LATEST_STATUS_EVENT_ID))
      .where(eq(libraryBooks.userId, userId))
      .all();
    return rows
      .filter((r) => r.source && r.externalId)
      .map((r) => ({
        libraryBookId: r.id,
        status: EVENT_TO_STATUS[r.latestEvent],
        book: toBookVolume(r),
      }));
  }

  /**
   * Every owned book flattened for CSV export, with reading-log facts (latest finished date, total
   * finish count) aggregated in-query. Status derives from the same latest-status-event join used by
   * the shelf views, so the exported Exclusive Shelf matches what the user sees in their library.
   */
  findExportRowsByUser(userId: number): ExportBook[] {
    const rows = db
      .select({
        id: libraryBooks.id,
        title: libraryBooks.title,
        authors: libraryBooks.authors,
        isbn: libraryBooks.isbn,
        rating: libraryBooks.rating,
        publisher: libraryBooks.publisher,
        pageCount: libraryBooks.pageCount,
        publishedDate: libraryBooks.publishedDate,
        addedDate: libraryBooks.addedDate,
        tags: libraryBooks.tags,
        review: libraryBooks.review,
        latestEvent: readingLog.event,
        dateRead: DATE_READ_EXPR,
        readCount: READ_COUNT_EXPR,
      })
      .from(libraryBooks)
      .innerJoin(readingLog, eq(readingLog.id, LATEST_STATUS_EVENT_ID))
      .where(eq(libraryBooks.userId, userId))
      .all();
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      authors: r.authors ? r.authors.split('|') : [],
      isbn: r.isbn,
      rating: r.rating,
      publisher: r.publisher,
      pageCount: r.pageCount,
      publishedDate: r.publishedDate,
      addedDate: r.addedDate,
      tags: r.tags ? z.array(z.string()).parse(JSON.parse(r.tags)) : [],
      review: r.review,
      status: EVENT_TO_STATUS[r.latestEvent],
      dateRead: r.dateRead,
      readCount: r.readCount,
    }));
  }

  /**
   * Single-query detail lookup. Returns the (entry, book) pair; the BooksService composes the
   * reading log onto this from ReadingLogRepository. Returns null if the book doesn't exist,
   * doesn't belong to the user, or has no source/externalId (manual entries can't be rendered
   * as a BookVolume yet).
   */
  findDetailByLibraryBookId(
    userId: number,
    libraryBookId: number
  ): Omit<LibraryBookDetail, 'log'> | null {
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

  /** Distinct tags across the user's library, flattened from each book's JSON array and sorted. */
  listTags(userId: number): string[] {
    const rows = db
      .select({ tags: libraryBooks.tags })
      .from(libraryBooks)
      .where(and(eq(libraryBooks.userId, userId), sql`${libraryBooks.tags} IS NOT NULL`))
      .all();
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row.tags) continue;
      for (const tag of z.array(z.string()).parse(JSON.parse(row.tags))) seen.add(tag);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }

  updateTags(libraryBookId: number, tags: string[]): void {
    db.update(libraryBooks)
      .set({ tags: tags.length > 0 ? JSON.stringify(tags) : null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updateDescription(libraryBookId: number, description: string): void {
    db.update(libraryBooks)
      .set({ description: description || null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updateCover(libraryBookId: number, url: string): void {
    db.update(libraryBooks)
      .set({ largeThumbnail: url, thumbnail: url })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updateTitle(libraryBookId: number, title: string): void {
    db.update(libraryBooks).set({ title }).where(eq(libraryBooks.id, libraryBookId)).run();
  }

  updatePublisher(libraryBookId: number, publisher: string): void {
    db.update(libraryBooks)
      .set({ publisher: publisher || null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updatePageCount(libraryBookId: number, pageCount: number): void {
    db.update(libraryBooks).set({ pageCount }).where(eq(libraryBooks.id, libraryBookId)).run();
  }

  updatePublishedDate(libraryBookId: number, publishedDate: string): void {
    db.update(libraryBooks)
      .set({ publishedDate: publishedDate || null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updateLanguage(libraryBookId: number, language: string): void {
    db.update(libraryBooks)
      .set({ language: language || null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updateIsbn(libraryBookId: number, isbn: string): void {
    db.update(libraryBooks)
      .set({ isbn: isbn || null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  updateRating(libraryBookId: number, rating: number | null): void {
    db.update(libraryBooks).set({ rating }).where(eq(libraryBooks.id, libraryBookId)).run();
  }

  updateReview(libraryBookId: number, review: string): void {
    db.update(libraryBooks)
      .set({ review: review || null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  clearRatingAndReview(libraryBookId: number): void {
    db.update(libraryBooks)
      .set({ rating: null, review: null })
      .where(eq(libraryBooks.id, libraryBookId))
      .run();
  }

  delete(libraryBookId: number): void {
    db.delete(libraryBooks).where(eq(libraryBooks.id, libraryBookId)).run();
  }

  /** Remove every book owned by the user. Returns how many rows were deleted. */
  deleteAllByUser(userId: number): number {
    return db.delete(libraryBooks).where(eq(libraryBooks.userId, userId)).run().changes;
  }

  refreshMetadata(libraryBookId: number, fields: import('@livre/types').RefreshMetadataBody): void {
    const set: Record<string, unknown> = {};
    if (fields.title !== undefined) set.title = fields.title;
    if (fields.authors !== undefined) set.authors = fields.authors.join('|') || null;
    if (fields.description !== undefined) set.description = fields.description || null;
    if (fields.thumbnail !== undefined) set.thumbnail = fields.thumbnail || null;
    if (fields.largeThumbnail !== undefined) set.largeThumbnail = fields.largeThumbnail || null;
    if (fields.isbn !== undefined) set.isbn = fields.isbn || null;
    if (fields.pageCount !== undefined) set.pageCount = fields.pageCount ?? null;
    if (fields.publisher !== undefined) set.publisher = fields.publisher || null;
    if (fields.publishedDate !== undefined) set.publishedDate = fields.publishedDate || null;
    if (fields.language !== undefined) set.language = fields.language || null;
    if (Object.keys(set).length === 0) return;
    db.update(libraryBooks).set(set).where(eq(libraryBooks.id, libraryBookId)).run();
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
        tags: metadata.tags.length > 0 ? JSON.stringify(metadata.tags) : null,
        fiction: metadata.fiction,
        genre: metadata.genre,
        language: metadata.language ?? null,
      })
      .returning({ id: libraryBooks.id })
      .get();
    if (!row) throw new Error('Failed to create library book');
    return row.id;
  }
}
