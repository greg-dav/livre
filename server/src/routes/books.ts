import { z } from 'zod';
import express, { type Router, type RequestHandler } from 'express';
import {
  bookRefSchema,
  bookVolumeSchema,
  libraryFormatsResponseSchema,
  importResultSchema,
  bookSourceSchema,
  importSourcesResponseSchema,
  bookSearchResponseSchema,
  searchScopeSchema,
  searchSortSchema,
  shelfFilterSchema,
  searchResponseSchema,
  createLogEventBodySchema,
  createLogEventResponseSchema,
  libraryBookDetailSchema,
  libraryResponseSchema,
  libraryTagsResponseSchema,
  updateTagsBodySchema,
  updateTagsResponseSchema,
  updateDescriptionBodySchema,
  updateDescriptionResponseSchema,
  updateCoverBodySchema,
  updateCoverResponseSchema,
  updateTitleBodySchema,
  updateTitleResponseSchema,
  updatePublisherBodySchema,
  updatePublisherResponseSchema,
  updatePageCountBodySchema,
  updatePageCountResponseSchema,
  updatePublishedDateBodySchema,
  updatePublishedDateResponseSchema,
  updateLanguageBodySchema,
  updateLanguageResponseSchema,
  updateIsbnBodySchema,
  updateIsbnResponseSchema,
  refreshMetadataBodySchema,
  refreshMetadataResponseSchema,
  updateRatingBodySchema,
  updateRatingResponseSchema,
  updateReviewBodySchema,
  updateReviewResponseSchema,
  updateLogEntryBodySchema,
  updateLogEntryResponseSchema,
  deleteLogEntryResponseSchema,
  resetReadingLogResponseSchema,
  removeFromLibraryResponseSchema,
  deleteLibraryResponseSchema,
} from '@livre/types';
import createError from 'http-errors';
import { SchemaRouter } from '../lib/SchemaRouter';
import { decodeBookRef } from '../lib/bookRef';
import { type BooksService } from '../services/BooksService';
import { type LibraryTransferService } from '../services/LibraryTransferService';

const parseBookRef = (
  raw: unknown
): { source: import('@livre/types').BookSource; externalId: string } => {
  const ref = bookRefSchema.safeParse(raw);
  if (!ref.success) throw createError(400, 'Invalid book reference');
  try {
    return decodeBookRef(ref.data);
  } catch {
    throw createError(400, 'Invalid book reference');
  }
};

export function createBooksRouter(
  service: BooksService,
  transfer: LibraryTransferService,
  requireAuth: RequestHandler
): Router {
  const router = new SchemaRouter().use(requireAuth);

  const startIndexOf = (raw: unknown): number =>
    z.coerce.number().int().min(0).safeParse(raw).data ?? 0;

  /** Faceted search: scope the query to a field, filter by shelf membership, sort, and paginate. */
  router.get('/search', searchResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const q = z.string().min(1, 'Query is required').safeParse(req.query.q);
    if (!q.success) throw createError(400, q.error.issues[0]?.message ?? 'Invalid query');
    const scope = searchScopeSchema.safeParse(req.query.scope).data ?? 'anything';
    const shelf = shelfFilterSchema.safeParse(req.query.shelf).data;
    const sort = searchSortSchema.safeParse(req.query.sort).data ?? 'relevance';
    respond(
      await service.search(user.id, q.data, scope, shelf, sort, startIndexOf(req.query.startIndex))
    );
  });

  /** Lightweight top-bar preview: a short page of raw results, no library join or faceting. */
  router.get('/search/quick', bookSearchResponseSchema, async (respond, req) => {
    const q = z.string().min(1, 'Query is required').safeParse(req.query.q);
    if (!q.success) throw createError(400, q.error.issues[0]?.message ?? 'Invalid query');
    respond(await service.quickSearch(q.data));
  });

  /** Books by a given author — the same faceted/paginated shape as search, pre-scoped to author. */
  router.get('/search/author/:name', searchResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const name = z.string().min(1).parse(req.params.name);
    const sort = searchSortSchema.safeParse(req.query.sort).data ?? 'relevance';
    respond(await service.getAuthorBooks(user.id, name, sort, startIndexOf(req.query.startIndex)));
  });

  /** Fetch full volume data for a single book by its opaque ref. */
  router.get('/search/book/:bookRef', bookVolumeSchema, async (respond, req) => {
    const { source, externalId } = parseBookRef(req.params.bookRef);
    respond(await service.getById(source, externalId));
  });

  /** Add a book to the library with an initial status event. */
  router.post(
    '/search/book/:bookRef/add',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const { source, externalId } = parseBookRef(req.params.bookRef);
      respond(await service.addToLibrary(user.id, source, externalId, body.event, body.date));
    }
  );

  /** Return all books in the authenticated user's library. */
  router.get('/library', libraryResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    respond(service.getLibrary(user.id));
  });

  /** Return the distinct tags across the user's library, for autocomplete. */
  router.get('/library/tags', libraryTagsResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    respond(service.getTags(user.id));
  });

  /** List the import/export formats the server offers, so both modals render from the server. */
  router.get('/formats', libraryFormatsResponseSchema, async (respond, req) => {
    if (!req.user) throw createError(401, 'Unauthorized');
    respond(transfer.listFormats());
  });

  /** List the metadata sources for the import view, with today's per-instance Google usage. */
  router.get('/import-sources', importSourcesResponseSchema, async (respond, req) => {
    if (!req.user) throw createError(401, 'Unauthorized');
    respond(transfer.listImportSources());
  });

  /**
   * Export the whole library as a downloadable file in the chosen format (default goodreads).
   * Registered on the raw router (not via SchemaRouter) because the body is the file itself, not
   * the JSON envelope SchemaRouter enforces. Must precede the `/library/:libraryBookId` matcher so
   * "export" isn't captured as an id.
   */
  router.router.get('/library/export', (req, res) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const format = z.string().min(1).safeParse(req.query.format).data ?? 'goodreads';
    const { content, mimeType, filename } = transfer.export(user.id, format);
    res.setHeader('Content-Type', `${mimeType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  });

  /**
   * Import a library file in the chosen format (default goodreads), pulling metadata from the chosen
   * source (default OPEN_LIBRARY). The body is the raw file text, parsed by express.text rather than
   * express.json — Goodreads exports run to several MB and carry CSV, not JSON. Existing books are
   * skipped; the response reports imported/skipped/failed/deferred.
   */
  router.router.post(
    '/library/import',
    express.text({ type: () => true, limit: '5mb' }),
    async (req, res, next) => {
      try {
        const user = req.user;
        if (!user) throw createError(401, 'Unauthorized');
        const content = typeof req.body === 'string' ? req.body : '';
        if (!content.trim()) throw createError(400, 'Empty import file');
        const format = z.string().min(1).safeParse(req.query.format).data ?? 'goodreads';
        const source = bookSourceSchema.safeParse(req.query.source).data ?? 'OPEN_LIBRARY';
        const result = await transfer.import(user.id, format, content, source);
        res.json(importResultSchema.parse(result));
      } catch (e) {
        next(e);
      }
    }
  );

  /** Return full volume data and shelf metadata for a single library book. */
  router.get('/library/:libraryBookId', libraryBookDetailSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
    const detail = service.getLibraryBook(user.id, libraryBookId);
    if (!detail) throw createError(404, 'Book not found');
    respond(detail);
  });

  /** Update the tags on a library book. */
  router.patch(
    '/library/:libraryBookId/tags',
    updateTagsBodySchema,
    updateTagsResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateTags(user.id, libraryBookId, body.tags);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the description on a library book. */
  router.patch(
    '/library/:libraryBookId/description',
    updateDescriptionBodySchema,
    updateDescriptionResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateDescription(user.id, libraryBookId, body.description);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the cover image URL on a library book. */
  router.patch(
    '/library/:libraryBookId/cover',
    updateCoverBodySchema,
    updateCoverResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateCover(user.id, libraryBookId, body.url);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the title on a library book. */
  router.patch(
    '/library/:libraryBookId/title',
    updateTitleBodySchema,
    updateTitleResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateTitle(user.id, libraryBookId, body.title);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the publisher on a library book. */
  router.patch(
    '/library/:libraryBookId/publisher',
    updatePublisherBodySchema,
    updatePublisherResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updatePublisher(user.id, libraryBookId, body.publisher);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the page count on a library book. */
  router.patch(
    '/library/:libraryBookId/page-count',
    updatePageCountBodySchema,
    updatePageCountResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updatePageCount(user.id, libraryBookId, body.pageCount);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the published date on a library book. */
  router.patch(
    '/library/:libraryBookId/published-date',
    updatePublishedDateBodySchema,
    updatePublishedDateResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updatePublishedDate(user.id, libraryBookId, body.publishedDate);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the language on a library book. */
  router.patch(
    '/library/:libraryBookId/language',
    updateLanguageBodySchema,
    updateLanguageResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateLanguage(user.id, libraryBookId, body.language);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the ISBN on a library book. */
  router.patch(
    '/library/:libraryBookId/isbn',
    updateIsbnBodySchema,
    updateIsbnResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateIsbn(user.id, libraryBookId, body.isbn);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Bulk-refresh metadata on a library book (e.g. after an ISBN lookup). */
  router.patch(
    '/library/:libraryBookId/metadata',
    refreshMetadataBodySchema,
    refreshMetadataResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.refreshMetadata(user.id, libraryBookId, body);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Log a reading event for a book already in the library. */
  router.post(
    '/library/:libraryBookId/log',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const text = body.event === 'note' || body.event === 'quote' ? body.text : undefined;
      const format = body.event === 'format' ? body.format : undefined;
      const result = service.logEvent(user.id, libraryBookId, body.event, body.date, text, format);
      if (!result) throw createError(404, 'Book not found');
      respond(result);
    }
  );

  /** Update the star rating on a library book. */
  router.patch(
    '/library/:libraryBookId/rating',
    updateRatingBodySchema,
    updateRatingResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateRating(user.id, libraryBookId, body.rating);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the review text on a library book. */
  router.patch(
    '/library/:libraryBookId/review',
    updateReviewBodySchema,
    updateReviewResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateReview(user.id, libraryBookId, body.review);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update text and/or date on an existing log entry. */
  router.patch(
    '/library/:libraryBookId/log/:logId',
    updateLogEntryBodySchema,
    updateLogEntryResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const logId = z.coerce.number().int().positive().parse(req.params.logId);
      const ok = service.updateLogEntry(user.id, libraryBookId, logId, body);
      if (!ok) throw createError(404, 'Log entry not found');
      respond({ ok: true });
    }
  );

  /** Delete a log entry. */
  router.delete(
    '/library/:libraryBookId/log/:logId',
    deleteLogEntryResponseSchema,
    async (respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const logId = z.coerce.number().int().positive().parse(req.params.logId);
      const ok = service.deleteLogEntry(user.id, libraryBookId, logId);
      if (!ok) throw createError(404, 'Log entry not found');
      respond({ ok: true });
    }
  );

  /** Reset a book's reading log, rating, and review back to a freshly shelved state. */
  router.post(
    '/library/:libraryBookId/reset',
    z.object({}).strict(),
    resetReadingLogResponseSchema,
    async (_body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.resetReadingLog(user.id, libraryBookId);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Wipe the user's entire library — every book, rating, review, and reading-log event. */
  router.delete('/library', deleteLibraryResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    respond({ ok: true, deleted: service.deleteLibrary(user.id) });
  });

  /** Permanently remove a book from the user's library. */
  router.delete(
    '/library/:libraryBookId',
    removeFromLibraryResponseSchema,
    async (respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.removeFromLibrary(user.id, libraryBookId);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  return router.router;
}
