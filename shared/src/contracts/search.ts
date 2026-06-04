import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema } from './_shared';
import { bookRefSchema } from '../domain/bookRef';
import {
  bookVolumeSchema,
  searchScopeSchema,
  searchSortSchema,
  shelfFilterSchema,
} from '../domain/books';
import { shelfStatusSchema } from '../domain/reading';

const c = initContract();

// ── Params & queries ────────────────────────────────────────────────────────
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

/**
 * Read-only book discovery: faceted catalog search, the top-bar quick preview, author pages, and a
 * single book looked up by its opaque `bookRef`. Mounted behind requireAuth at `/api/search`.
 * Saving a discovered book into the library is a write and lives in the library contract, so this
 * contract is entirely GET.
 */
export const searchContract = c.router(
  {
    search: {
      method: 'GET',
      path: '/',
      query: searchQuery,
      responses: { 200: searchResponse },
    },
    quickSearch: {
      method: 'GET',
      path: '/quick',
      query: quickSearchQuery,
      responses: { 200: bookSearchResponse },
    },
    authorBooks: {
      method: 'GET',
      path: '/author/:name',
      pathParams: z.object({ name: z.string().min(1) }),
      query: authorQuery,
      responses: { 200: searchResponse },
    },
    getBook: {
      method: 'GET',
      path: '/book/:bookRef',
      pathParams: bookRefParams,
      responses: { 200: bookVolumeSchema },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
