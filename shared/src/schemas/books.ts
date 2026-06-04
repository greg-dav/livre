import { z } from 'zod';
import { bookRefSchema, bookSourceSchema } from './bookRef';
import { shelfEntrySchema, shelfStatusSchema, logEntrySchema } from './shelves';

export { bookSourceSchema, bookRefSchema } from './bookRef';
export type { BookSource } from './bookRef';

export const bookGenreSchema = z.enum([
  'antiques-collectibles',
  'architecture',
  'art',
  'bibles',
  'biography-autobiography',
  'body-mind-spirit',
  'business-economics',
  'comics-graphic-novels',
  'computers',
  'cooking',
  'crafts-hobbies',
  'design',
  'drama',
  'education',
  'family-relationships',
  'fiction',
  'foreign-language-study',
  'games-activities',
  'gardening',
  'health-fitness',
  'history',
  'house-home',
  'humor',
  'juvenile-fiction',
  'juvenile-nonfiction',
  'language-arts-disciplines',
  'law',
  'literary-collections',
  'literary-criticism',
  'mathematics',
  'medical',
  'music',
  'nature',
  'performing-arts',
  'pets',
  'philosophy',
  'photography',
  'poetry',
  'political-science',
  'psychology',
  'reference',
  'religion',
  'science',
  'self-help',
  'social-science',
  'sports-recreation',
  'study-aids',
  'technology-engineering',
  'transportation',
  'travel',
  'true-crime',
  'young-adult-fiction',
  'young-adult-nonfiction',
  'unknown',
]);
export type BookGenre = z.infer<typeof bookGenreSchema>;

/**
 * Metadata fields shared between the transient API cache and a user's permanent library record.
 * Both compose this schema so the two stay in sync.
 */
export const bookMetadataSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  largeThumbnail: z.string().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().optional(),
  publisher: z.string().optional(),
  tags: z.array(z.string()),
  fiction: z.boolean(),
  genre: bookGenreSchema,
  language: z.string().optional(),
});
export type BookMetadata = z.infer<typeof bookMetadataSchema>;

export const bookVolumeSchema = bookMetadataSchema.extend({
  bookRef: bookRefSchema,
});
export type BookVolume = z.infer<typeof bookVolumeSchema>;

/**
 * A book as it lives in a user's library. Identical to BookVolume except `bookRef` is nullable:
 * a manual entry (e.g. an import with no resolvable source) has no upstream provider and therefore
 * no ref. The library detail view uses this so those books still render instead of 404ing.
 */
export const libraryVolumeSchema = bookMetadataSchema.extend({
  bookRef: bookRefSchema.nullable(),
});
export type LibraryVolume = z.infer<typeof libraryVolumeSchema>;

export const bookSearchResultSchema = bookVolumeSchema;
export type BookSearchResult = BookVolume;

export const bookSearchResponseSchema = z.object({
  results: z.array(bookVolumeSchema),
  total: z.number(),
});
export type BookSearchResponse = z.infer<typeof bookSearchResponseSchema>;

/**
 * Which field a search query is matched against. Provider-agnostic on purpose — the client picks a
 * scope and the server translates it to whatever query syntax the underlying source needs, so the
 * client never learns where the metadata comes from.
 */
export const searchScopeSchema = z.enum(['anything', 'title', 'author', 'subject', 'isbn']);
export type SearchScope = z.infer<typeof searchScopeSchema>;

/**
 * Sort order for a result set. The server maps these onto the source's native ordering so results
 * stay correctly ordered across paginated pages — which is why there's no "oldest" (the source
 * can't produce it without fetching the whole result set).
 */
export const searchSortSchema = z.enum(['relevance', 'newest']);
export type SearchSort = z.infer<typeof searchSortSchema>;

/** Shelf-membership bucket to keep. Omitted means no shelf filter (both buckets pass). */
export const shelfFilterSchema = z.enum(['in', 'out']);
export type ShelfFilter = z.infer<typeof shelfFilterSchema>;

/**
 * A search hit annotated with the user's library state, so the client renders shelf status and
 * routes to the owned copy without a second round-trip. Both fields are null when the book isn't
 * in the user's library.
 */
export const searchResultSchema = bookVolumeSchema.extend({
  libraryBookId: z.number().nullable(),
  libraryStatus: shelfStatusSchema.nullable(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  total: z.number(),
  shelfCounts: z.object({ in: z.number(), out: z.number() }),
  // Cursor for the next page, or null when the source has no more results. Advances by the raw page
  // size (not the filtered result count) so shelf-filtered pagination still walks the full source.
  nextStartIndex: z.number().nullable(),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export const libraryBookDetailSchema = z.object({
  entry: shelfEntrySchema,
  book: libraryVolumeSchema,
  log: z.array(logEntrySchema),
});
export type LibraryBookDetail = z.infer<typeof libraryBookDetailSchema>;

export const updateTagsBodySchema = z.object({ tags: z.array(z.string()) });
export type UpdateTagsBody = z.infer<typeof updateTagsBodySchema>;

export const updateTagsResponseSchema = z.object({ ok: z.literal(true) });

export const libraryTagsResponseSchema = z.array(z.string());

const okResponse = z.object({ ok: z.literal(true) });

export const updateMetadataBodySchema = bookMetadataSchema
  .pick({
    title: true,
    authors: true,
    description: true,
    thumbnail: true,
    largeThumbnail: true,
    isbn: true,
    pageCount: true,
    publisher: true,
    publishedDate: true,
    language: true,
  })
  .partial();
export type UpdateMetadataBody = z.infer<typeof updateMetadataBodySchema>;
export const updateMetadataResponseSchema = okResponse;

export const updateRatingBodySchema = z.object({
  rating: z.number().min(1).max(5).multipleOf(0.5).nullable(),
});
export type UpdateRatingBody = z.infer<typeof updateRatingBodySchema>;
export const updateRatingResponseSchema = okResponse;

export const updateReviewBodySchema = z.object({ review: z.string() });
export type UpdateReviewBody = z.infer<typeof updateReviewBodySchema>;
export const updateReviewResponseSchema = okResponse;

export const updateLogEntryBodySchema = z.object({
  text: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type UpdateLogEntryBody = z.infer<typeof updateLogEntryBodySchema>;
export const updateLogEntryResponseSchema = okResponse;
export const deleteLogEntryResponseSchema = okResponse;

export const resetReadingLogResponseSchema = okResponse;
export const removeFromLibraryResponseSchema = okResponse;

export const deleteLibraryResponseSchema = z.object({
  ok: z.literal(true),
  deleted: z.number().int().nonnegative(),
});
export type DeleteLibraryResponse = z.infer<typeof deleteLibraryResponseSchema>;

/**
 * A library transfer format the server can import from and/or export to (e.g. Goodreads CSV). The
 * client renders the import/export modals from this list rather than hardcoding formats, so adding
 * a server-side format adapter surfaces in the UI with no client change.
 */
export const libraryFormatSchema = z.object({
  id: z.string(),
  label: z.string(),
  fileExtension: z.string(),
  capabilities: z.object({ import: z.boolean(), export: z.boolean() }),
});
export type LibraryFormat = z.infer<typeof libraryFormatSchema>;

export const libraryFormatsResponseSchema = z.array(libraryFormatSchema);
export type LibraryFormatsResponse = z.infer<typeof libraryFormatsResponseSchema>;

/**
 * Outcome of an import run. `imported` books were added, `skipped` matched a book already in the
 * library (by ISBN, source id, or title/author) and was left untouched, and `failed` rows couldn't
 * be parsed or persisted. `deferred` books weren't imported because the chosen source ran out of
 * daily budget (Google Books) — re-running the import once the quota resets picks them up.
 * Duplicate rows *within the file* aren't reported here — one copy is imported and the rest silently
 * dropped. `errors` carries a bounded sample of per-row failures.
 */
export const importResultSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  deferred: z.number().int().nonnegative(),
  errors: z.array(z.object({ row: z.number().int(), message: z.string() })),
});
export type ImportResult = z.infer<typeof importResultSchema>;

/** Daily usage of a metered source (Google Books), per Livre instance. The limit resets at midnight
 * US Pacific (Google's quota reset); `remaining` is what's left for today. */
export const sourceUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
});
export type SourceUsage = z.infer<typeof sourceUsageSchema>;

/** A metadata source the import view can pull from. `metered` sources carry today's `usage`;
 * unmetered ones (Open Library) have `usage: null`. */
export const importSourceSchema = z.object({
  id: bookSourceSchema,
  label: z.string(),
  metered: z.boolean(),
  usage: sourceUsageSchema.nullable(),
});
export type ImportSource = z.infer<typeof importSourceSchema>;

export const importSourcesResponseSchema = z.array(importSourceSchema);
export type ImportSourcesResponse = z.infer<typeof importSourcesResponseSchema>;
