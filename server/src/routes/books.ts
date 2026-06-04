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
  updateMetadataBodySchema,
  updateMetadataResponseSchema,
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
import { requireUser, idParam } from '../lib/request';
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
    const user = requireUser(req);
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
    const user = requireUser(req);
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
      const user = requireUser(req);
      const { source, externalId } = parseBookRef(req.params.bookRef);
      respond(await service.addToLibrary(user.id, source, externalId, body.event, body.date));
    }
  );

  /** Return all books in the authenticated user's library. */
  router.get('/library', libraryResponseSchema, async (respond, req) => {
    respond(service.getLibrary(requireUser(req).id));
  });

  /** Return the distinct tags across the user's library, for autocomplete. */
  router.get('/library/tags', libraryTagsResponseSchema, async (respond, req) => {
    respond(service.getTags(requireUser(req).id));
  });

  /** List the import/export formats the server offers, so both modals render from the server. */
  router.get('/formats', libraryFormatsResponseSchema, async (respond, req) => {
    requireUser(req);
    respond(transfer.listFormats());
  });

  /** List the metadata sources for the import view, with today's per-instance Google usage. */
  router.get('/import-sources', importSourcesResponseSchema, async (respond, req) => {
    requireUser(req);
    respond(transfer.listImportSources());
  });

  /**
   * Export the whole library as a downloadable file in the chosen format (default goodreads).
   * Registered on the raw router (not via SchemaRouter) because the body is the file itself, not
   * the JSON envelope SchemaRouter enforces. Must precede the `/library/:libraryBookId` matcher so
   * "export" isn't captured as an id.
   */
  router.router.get('/library/export', (req, res) => {
    const user = requireUser(req);
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
        const user = requireUser(req);
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
    const detail = service.getLibraryBook(requireUser(req).id, idParam(req, 'libraryBookId'));
    if (!detail) throw createError(404, 'Book not found');
    respond(detail);
  });

  /** Update the tags on a library book. */
  router.patch(
    '/library/:libraryBookId/tags',
    updateTagsBodySchema,
    updateTagsResponseSchema,
    async (body, respond, req) => {
      const ok = service.updateTags(requireUser(req).id, idParam(req, 'libraryBookId'), body.tags);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /**
   * Partial update of a library book's metadata snapshot — any subset of the editable fields
   * (title, authors, description, cover, isbn, pageCount, publisher, publishedDate, language).
   * Backs both the inline per-field edits and the ISBN-lookup "apply found metadata" flow.
   */
  router.patch(
    '/library/:libraryBookId/metadata',
    updateMetadataBodySchema,
    updateMetadataResponseSchema,
    async (body, respond, req) => {
      const ok = service.updateMetadata(requireUser(req).id, idParam(req, 'libraryBookId'), body);
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
      const user = requireUser(req);
      const libraryBookId = idParam(req, 'libraryBookId');
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
      const ok = service.updateRating(
        requireUser(req).id,
        idParam(req, 'libraryBookId'),
        body.rating
      );
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
      const ok = service.updateReview(
        requireUser(req).id,
        idParam(req, 'libraryBookId'),
        body.review
      );
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
      const ok = service.updateLogEntry(
        requireUser(req).id,
        idParam(req, 'libraryBookId'),
        idParam(req, 'logId'),
        body
      );
      if (!ok) throw createError(404, 'Log entry not found');
      respond({ ok: true });
    }
  );

  /** Delete a log entry. */
  router.delete(
    '/library/:libraryBookId/log/:logId',
    deleteLogEntryResponseSchema,
    async (respond, req) => {
      const ok = service.deleteLogEntry(
        requireUser(req).id,
        idParam(req, 'libraryBookId'),
        idParam(req, 'logId')
      );
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
      const ok = service.resetReadingLog(requireUser(req).id, idParam(req, 'libraryBookId'));
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Wipe the user's entire library — every book, rating, review, and reading-log event. */
  router.delete('/library', deleteLibraryResponseSchema, async (respond, req) => {
    respond({ ok: true, deleted: service.deleteLibrary(requireUser(req).id) });
  });

  /** Permanently remove a book from the user's library. */
  router.delete(
    '/library/:libraryBookId',
    removeFromLibraryResponseSchema,
    async (respond, req) => {
      const ok = service.removeFromLibrary(requireUser(req).id, idParam(req, 'libraryBookId'));
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  return router.router;
}
