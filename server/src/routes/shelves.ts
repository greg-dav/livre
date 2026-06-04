import { type Router, type RequestHandler } from 'express';
import createError from 'http-errors';
import { shelfResponseSchema, shelfStatusSchema } from '@livre/types';
import { SchemaRouter } from '../lib/SchemaRouter';
import { requireUser } from '../lib/request';
import { type BooksService } from '../services/BooksService';

export function createShelvesRouter(service: BooksService, requireAuth: RequestHandler): Router {
  const router = new SchemaRouter().use(requireAuth);

  /** Return all books on a given shelf along with counts for all shelf statuses. */
  router.get('/:status', shelfResponseSchema, async (respond, req) => {
    const user = requireUser(req);
    const parsed = shelfStatusSchema.safeParse(req.params.status);
    if (!parsed.success) throw createError(400, 'Invalid shelf status');
    respond(service.getShelf(user.id, parsed.data));
  });

  return router.router;
}
