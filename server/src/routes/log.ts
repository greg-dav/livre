import { type Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';

export function createLogRouter(): Router {
  const router = new SchemaRouter().use(requireAuth);

  // POST /api/log
  router.router.post('/', (_req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  return router.router;
}
