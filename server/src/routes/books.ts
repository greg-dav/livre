import { z } from 'zod';
import { type Router } from 'express';
import { bookSearchResponseSchema, bookSearchResultSchema } from '@livre/types';
import createError from 'http-errors';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';
import { type BooksService } from '../services/BooksService';

export function createBooksRouter(service: BooksService): Router {
  const router = new SchemaRouter().use(requireAuth);

  // /search and /author/:name must be registered before /:googleId
  router.get('/search', bookSearchResponseSchema, async (respond, req) => {
    const q = z.string().min(1, 'Query is required').safeParse(req.query.q);
    if (!q.success) throw createError(400, q.error.issues[0]?.message ?? 'Invalid query');
    respond(await service.search(q.data));
  });

  router.get('/author/:name', bookSearchResponseSchema, async (respond, req) => {
    const name = z.string().min(1).parse(req.params.name);
    respond(await service.getAuthorBooks(name));
  });

  router.get('/:googleId', bookSearchResultSchema, async (respond, req) => {
    respond(await service.getById(req.params.googleId));
  });

  return router.router;
}
