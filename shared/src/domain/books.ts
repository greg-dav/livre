import { z } from 'zod';
import { bookRefSchema, bookSourceSchema } from './bookRef';

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

/** A quick-search hit is just a book volume; aliased for call-site clarity. */
export type BookSearchResult = BookVolume;

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
