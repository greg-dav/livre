import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, okResponseSchema } from './_shared';
import { bookRefSchema } from '../domain/bookRef';
import {
  libraryVolumeSchema,
  bookMetadataSchema,
  libraryFormatSchema,
  importSourceSchema,
} from '../domain/books';
import {
  shelfEntrySchema,
  shelfStatusSchema,
  shelfCountsSchema,
  logEntrySchema,
  bookFormatSchema,
} from '../domain/reading';

const c = initContract();

// ── Params ──────────────────────────────────────────────────────────────────
const libraryBookIdParams = z.object({ libraryBookId: z.coerce.number().int().positive() });
const logEntryParams = libraryBookIdParams.extend({ logId: z.coerce.number().int().positive() });
const shelfParams = z.object({ status: shelfStatusSchema });

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

// Adding a discovered book to the library: the opaque bookRef identifies the source book, and the
// log-event fields seed the book's first reading-log entry. The route decodes bookRef before
// delegating, so book identity never leaks a source past the API boundary.
const addToLibraryBody = z.intersection(z.object({ bookRef: bookRefSchema }), createLogEventBody);
export type AddToLibraryBody = z.infer<typeof addToLibraryBody>;

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
const libraryResponse = z.array(shelfEntrySchema);
export type LibraryResponse = z.infer<typeof libraryResponse>;

const libraryTagsResponse = z.array(z.string());

const shelfResponse = z.object({
  entries: z.array(shelfEntrySchema),
  counts: shelfCountsSchema,
});
export type ShelfResponse = z.infer<typeof shelfResponse>;

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
 * The user's owned library: the collection itself (list, tags, shelves, transfer formats), adding a
 * discovered book, per-book metadata/tags/rating/review edits, and the reading-log events nested
 * under each book. Mounted behind requireAuth at `/api/library`. The non-JSON export/import routes
 * live outside this contract as plain Express, since their bodies are a file download and raw CSV
 * rather than the JSON envelope ts-rest enforces.
 *
 * Key order is significant: ts-rest registers routes in this order, so single-segment literal paths
 * (`/tags`, `/formats`, `/import-sources`) must precede the `/:libraryBookId` matcher that would
 * otherwise capture them.
 */
export const libraryContract = c.router(
  {
    add: {
      method: 'POST',
      path: '/',
      body: addToLibraryBody,
      responses: { 200: createLogEventResponse },
    },
    getLibrary: {
      method: 'GET',
      path: '/',
      responses: { 200: libraryResponse },
    },
    deleteLibrary: {
      method: 'DELETE',
      path: '/',
      responses: { 200: deleteLibraryResponse },
    },
    getTags: {
      method: 'GET',
      path: '/tags',
      responses: { 200: libraryTagsResponse },
    },
    getShelf: {
      method: 'GET',
      path: '/shelf/:status',
      pathParams: shelfParams,
      responses: { 200: shelfResponse },
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

    getLibraryBook: {
      method: 'GET',
      path: '/:libraryBookId',
      pathParams: libraryBookIdParams,
      responses: { 200: libraryBookDetail, ...notFound },
    },
    updateTags: {
      method: 'PATCH',
      path: '/:libraryBookId/tags',
      pathParams: libraryBookIdParams,
      body: updateTagsBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    updateMetadata: {
      method: 'PATCH',
      path: '/:libraryBookId/metadata',
      pathParams: libraryBookIdParams,
      body: updateMetadataBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    logEvent: {
      method: 'POST',
      path: '/:libraryBookId/log',
      pathParams: libraryBookIdParams,
      body: createLogEventBody,
      responses: { 200: createLogEventResponse, ...notFound },
    },
    updateRating: {
      method: 'PATCH',
      path: '/:libraryBookId/rating',
      pathParams: libraryBookIdParams,
      body: updateRatingBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    updateReview: {
      method: 'PATCH',
      path: '/:libraryBookId/review',
      pathParams: libraryBookIdParams,
      body: updateReviewBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    updateLogEntry: {
      method: 'PATCH',
      path: '/:libraryBookId/log/:logId',
      pathParams: logEntryParams,
      body: updateLogEntryBody,
      responses: { 200: okResponseSchema, ...notFound },
    },
    deleteLogEntry: {
      method: 'DELETE',
      path: '/:libraryBookId/log/:logId',
      pathParams: logEntryParams,
      responses: { 200: okResponseSchema, ...notFound },
    },
    resetReadingLog: {
      method: 'POST',
      path: '/:libraryBookId/reset',
      pathParams: libraryBookIdParams,
      body: z.object({}).strict(),
      responses: { 200: okResponseSchema, ...notFound },
    },
    removeFromLibrary: {
      method: 'DELETE',
      path: '/:libraryBookId',
      pathParams: libraryBookIdParams,
      responses: { 200: okResponseSchema, ...notFound },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
