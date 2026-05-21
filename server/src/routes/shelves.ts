import { type Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';

export function createShelvesRouter(): Router {
  const router = new SchemaRouter().use(requireAuth);

  // GET /api/shelves/:status
  router.router.get('/:status', (_req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  return router.router;
}
