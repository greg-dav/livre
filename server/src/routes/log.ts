import { type Router, type RequestHandler } from 'express';
import { SchemaRouter } from '../lib/SchemaRouter';

export function createLogRouter(requireAuth: RequestHandler): Router {
  const router = new SchemaRouter().use(requireAuth);

  /** Stub for the upcoming journal log endpoint — not yet implemented. */
  router.router.post('/', (_req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  return router.router;
}
