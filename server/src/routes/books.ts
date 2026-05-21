import { type Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';

export function createBooksRouter(): Router {
  const router = new SchemaRouter().use(requireAuth);

  // GET /api/books/search?q=
  router.router.get('/search', (_req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  return router.router;
}
