import { z } from 'zod';
import { type Router } from 'express';
import {
  bookRefSchema,
  bookVolumeSchema,
  bookSearchResponseSchema,
  createLogEventBodySchema,
  createLogEventResponseSchema,
  libraryBookDetailSchema,
  libraryResponseSchema,
  updateTagsBodySchema,
  updateTagsResponseSchema,
} from '@livre/types';
import createError from 'http-errors';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';
import { decodeBookRef } from '../lib/bookRef';
import { type BooksService } from '../services/BooksService';

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

export function createBooksRouter(service: BooksService): Router {
  const router = new SchemaRouter().use(requireAuth);

  /** Search by query string. */
  router.get('/search', bookSearchResponseSchema, async (respond, req) => {
    const q = z.string().min(1, 'Query is required').safeParse(req.query.q);
    if (!q.success) throw createError(400, q.error.issues[0]?.message ?? 'Invalid query');
    respond(await service.search(q.data));
  });

  /** Return books by a given author. */
  router.get('/search/author/:name', bookSearchResponseSchema, async (respond, req) => {
    const name = z.string().min(1).parse(req.params.name);
    respond(await service.getAuthorBooks(name));
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

  /** Log a reading event for a book already in the library. */
  router.post(
    '/library/:libraryBookId/log',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const result = service.logEvent(user.id, libraryBookId, body.event, body.date);
      if (!result) throw createError(404, 'Book not found');
      respond(result);
    }
  );

  return router.router;
}
