import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, okResponseSchema } from './_shared';
import { bookRefSchema } from '../domain/bookRef';
import {
  bookVolumeSchema,
  libraryVolumeSchema,
  bookMetadataSchema,
  searchScopeSchema,
  searchSortSchema,
  shelfFilterSchema,
  libraryFormatSchema,
  importSourceSchema,
} from '../domain/books';
import {
  shelfEntrySchema,
  shelfStatusSchema,
  logEntrySchema,
  bookFormatSchema,
} from '../domain/reading';

const c = initContract();

// ── Params & queries ────────────────────────────────────────────────────────
const libraryBookIdParams = z.object({ libraryBookId: z.coerce.number().int().positive() });
const logEntryParams = libraryBookIdParams.extend({ logId: z.coerce.number().int().positive() });
const bookRefParams = z.object({ bookRef: bookRefSchema });

const facetedQuery = z.object({
  scope: searchScopeSchema.default('anything'),
  shelf: shelfFilterSchema.optional(),
  sort: searchSortSchema.default('relevance'),
  startIndex: z.coerce.number().int().min(0).default(0),
});
const searchQuery = facetedQuery.extend({ q: z.string().min(1, 'Query is required') });
const quickSearchQuery = z.object({ q: z.string().min(1, 'Query is required') });
const authorQuery = z.object({
  sort: searchSortSchema.default('relevance'),
  startIndex: z.coerce.number().int().min(0).default(0),
});

// ── Request bodies ──────────────────────────────────────────────────────────
const createLogEventBody = z.union([
  z.object({
    event: z.enum(['shelved', 'started', 'restarted', 'finished', 'dnf']),
    date: z.string().optional(),
  }),
  z.object({ event: z.enum(['note', 'quote']), date: z.string().optional(), text: z.string() }),
  z.object({ event: z.literal('format'), date: z.string().optional(), format: bookFormatSchema }),
]);
export type CreateLogEventBody = z.infer<typeof createLogEventBody>;

const updateTagsBody = z.object({ tags: z.array(z.string()) });

// Tighten the two fields a user types directly (title, pageCount) beyond bookMetadataSchema's
// permissive base — but leave publishedDate/language permissive: this same body also backs the
// ISBN "apply found metadata" flow, which forwards raw upstream values (e.g. publishedDate
// "March 2004", empty language) that messy sources legitimately return. The per-field manual
// editors guard those client-side. .partial() keeps single-field PATCH bodies valid.
const updateMetadataBody = bookMetadataSchema
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
  .extend({
    title: z.string().min(1),
    pageCount: z.number().int().positive(),
  })
  .partial();
export type UpdateMetadataBody = z.infer<typeof updateMetadataBody>;

const updateRatingBody = z.object({
  rating: z.number().min(1).max(5).multipleOf(0.5).nullable(),
});

const updateReviewBody = z.object({ review: z.string() });

const updateLogEntryBody = z.object({
  text: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type UpdateLogEntryBody = z.infer<typeof updateLogEntryBody>;

// ── Response envelopes ──────────────────────────────────────────────────────
const bookSearchResponse = z.object({
  results: z.array(bookVolumeSchema),
  total: z.number(),
});
export type BookSearchResponse = z.infer<typeof bookSearchResponse>;

const searchResult = bookVolumeSchema.extend({
  libraryBookId: z.number().nullable(),
  libraryStatus: shelfStatusSchema.nullable(),
});
export type SearchResult = z.infer<typeof searchResult>;

const searchResponse = z.object({
  results: z.array(searchResult),
  total: z.number(),
  shelfCounts: z.object({ in: z.number(), out: z.number() }),
  // Cursor for the next page, or null when the source has no more results. Advances by the raw page
  // size (not the filtered result count) so shelf-filtered pagination still walks the full source.
  nextStartIndex: z.number().nullable(),
});
export type SearchResponse = z.infer<typeof searchResponse>;

const libraryResponse = z.array(shelfEntrySchema);
export type LibraryResponse = z.infer<typeof libraryResponse>;

const libraryTagsResponse = z.array(z.string());

const libraryBookDetail = z.object({
  entry: shelfEntrySchema,
  book: libraryVolumeSchema,
  log: z.array(logEntrySchema),
});
export type LibraryBookDetail = z.infer<typeof libraryBookDetail>;

const createLogEventResponse = z.object({ libraryBookId: z.number(), logId: z.number() });
export type CreateLogEventResponse = z.infer<typeof createLogEventResponse>;

const deleteLibraryResponse = z.object({
  ok: z.literal(true),
  deleted: z.number().int().nonnegative(),
});

const libraryFormatsResponse = z.array(libraryFormatSchema);
const importSourcesResponse = z.array(importSourceSchema);

const notFound = { 404: apiErrorSchema } as const;

/**
 * The books API: discovery (search/author/book by opaque bookRef), the user's library collection,
 * and per-book mutations (metadata, tags, rating, review, reading-log events). Mounted behind
 * requireAuth. The non-JSON export/import routes live outside this contract as plain Express, since
 * their bodies are a file download and raw CSV rather than the JSON envelope ts-rest enforces.
 *
 * Key order is significant: ts-rest registers routes in this order, so literal paths
 * (`/library/tags`) must precede the `/library/:libraryBookId` matcher that would otherwise capture
 * them.
 */
export const booksContract = c.router(
  {
    search: {
      method: 'GET',
      path: '/search',
      query: searchQuery,
      responses: { 200: searchResponse },
    },
    quickSearch: {
      method: 'GET',
      path: '/search/quick',
      query: quickSearchQuery,
      responses: { 200: bookSearchResponse },
    },
    authorBooks: {
      method: 'GET',
      path: '/search/author/:name',
      pathParams: z.object({ name: z.string().min(1) }),
      query: authorQuery,
      responses: { 200: searchResponse },
    },
    getBook: {
      method: 'GET',
      path: '/search/book/:bookRef',
      pathParams: bookRefParams,
      responses: { 200: bookVolumeSchema },
    },
    addToLibrary: {
      method: 'POST',
      path: '/search/book/:bookRef/add',
      pathParams: bookRefParams,
      body: createLogEventBody,
      responses: { 200: createLogEventResponse },
    },

    getLibrary: {
      method: 'GET',
      path: '/library',
      responses: { 200: libraryResponse },
    },
    getTags: {
      method: 'GET',
      path: '/library/tags',
      responses: { 200: libraryTagsResponse },
    },
    getFormats: {
      method: 'GET',
      path: '/formats',
      responses: { 200: libraryFormatsResponse },
    },
    getImportSources: {
      method: 'GET',
      path: '/import-sources',
      responses: { 200: importSourcesResponse },
    },
    deleteLibrary: {
      method: 'DELETE',
      path: '/library',
      responses: { 200: deleteLibraryResponse },
    },

    getLibraryBook: {
      method: 'GET',
      path: '/library/:libraryBookId',
      pathParams: libraryBookIdParams,
      responses: { 200: libraryBookDetail, ...notFound },
    },
    updateTags: {
      method: 'PATCH',
      path: '/library/:libraryBookId/tags',
      pathParams: libraryBookIdParams,
      body: updateTagsBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    updateMetadata: {
      method: 'PATCH',
      path: '/library/:libraryBookId/metadata',
      pathParams: libraryBookIdParams,
      body: updateMetadataBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    logEvent: {
      method: 'POST',
      path: '/library/:libraryBookId/log',
      pathParams: libraryBookIdParams,
      body: createLogEventBody,
      responses: { 200: createLogEventResponse, ...notFound },
    },
    updateRating: {
      method: 'PATCH',
      path: '/library/:libraryBookId/rating',
      pathParams: libraryBookIdParams,
      body: updateRatingBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    updateReview: {
      method: 'PATCH',
      path: '/library/:libraryBookId/review',
      pathParams: libraryBookIdParams,
      body: updateReviewBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    updateLogEntry: {
      method: 'PATCH',
      path: '/library/:libraryBookId/log/:logId',
      pathParams: logEntryParams,
      body: updateLogEntryBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    deleteLogEntry: {
      method: 'DELETE',
      path: '/library/:libraryBookId/log/:logId',
      pathParams: logEntryParams,
      responses: { 200: okResponseSchema, ...notFound },
    },
    resetReadingLog: {
      method: 'POST',
      path: '/library/:libraryBookId/reset',
      pathParams: libraryBookIdParams,
      body: z.object({}).strict(),
      responses: { 200: okResponseSchema, ...notFound },
    },
    removeFromLibrary: {
      method: 'DELETE',
      path: '/library/:libraryBookId',
      pathParams: libraryBookIdParams,
      responses: { 200: okResponseSchema, ...notFound },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
