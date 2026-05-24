import { type Router } from 'express';
import createError from 'http-errors';
import { shelfResponseSchema, shelfStatusSchema } from '@livre/types';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';
import { type BooksService } from '../services/BooksService';

export function createShelvesRouter(service: BooksService): Router {
  const router = new SchemaRouter().use(requireAuth);

  /** Return all books on a given shelf along with counts for all shelf statuses. */
  router.get('/:status', shelfResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const parsed = shelfStatusSchema.safeParse(req.params.status);
    if (!parsed.success) throw createError(400, 'Invalid shelf status');
    respond(service.getShelf(user.id, parsed.data));
  });

  return router.router;
}
