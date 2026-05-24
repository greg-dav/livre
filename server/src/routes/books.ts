import { z } from 'zod';
import { type Router } from 'express';
import {
  bookVolumeSchema,
  bookSearchResponseSchema,
  createLogEventBodySchema,
  createLogEventResponseSchema,
  libraryBookDetailSchema,
  libraryResponseSchema,
} from '@livre/types';
import createError from 'http-errors';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';
import { type BooksService } from '../services/BooksService';

export function createBooksRouter(service: BooksService): Router {
  const router = new SchemaRouter().use(requireAuth);

  /** Search Google Books by query string. */
  router.get('/search', bookSearchResponseSchema, async (respond, req) => {
    const q = z.string().min(1, 'Query is required').safeParse(req.query.q);
    if (!q.success) throw createError(400, q.error.issues[0]?.message ?? 'Invalid query');
    respond(await service.search(q.data));
  });

  /** Return books by a given author via Google Books. */
  router.get('/search/author/:name', bookSearchResponseSchema, async (respond, req) => {
    const name = z.string().min(1).parse(req.params.name);
    respond(await service.getAuthorBooks(name));
  });

  /** Fetch full volume data for a single book from Google Books. */
  router.get('/search/book/:googleId', bookVolumeSchema, async (respond, req) => {
    respond(await service.getById(req.params.googleId));
  });

  /** Add a Google Books volume to the library with an initial status event. */
  router.post(
    '/search/book/:googleId/add',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      respond(await service.addToLibrary(user.id, req.params.googleId, body.event, body.date));
    }
  );

  /** Return all books in the authenticated user's library. */
  router.get('/library', libraryResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    respond(service.getLibrary(user.id));
  });

  /** Return full volume data and shelf metadata for a single library book. */
  router.get('/library/:userBookId', libraryBookDetailSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const userBookId = z.coerce.number().int().positive().parse(req.params.userBookId);
    const detail = await service.getLibraryBook(user.id, userBookId);
    if (!detail) throw createError(404, 'Book not found');
    respond(detail);
  });

  /** Log a reading event for a book already in the library. */
  router.post(
    '/library/:userBookId/log',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const userBookId = z.coerce.number().int().positive().parse(req.params.userBookId);
      const result = service.logEvent(user.id, userBookId, body.event, body.date);
      if (!result) throw createError(404, 'Book not found');
      respond(result);
    }
  );

  return router.router;
}
