import { type Router, type RequestHandler } from 'express';
import { timelineResponseSchema } from '@livre/types';
import { SchemaRouter } from '../lib/SchemaRouter';
import { requireUser } from '../lib/request';
import { type LogService } from '../services/LogService';

export function createLogRouter(service: LogService, requireAuth: RequestHandler): Router {
  const router = new SchemaRouter().use(requireAuth);

  /**
   * GET /api/log — the reading timeline. Optional `start` & `end` (YYYY-MM-DD) filter to books with
   * a reading cycle overlapping that range, so large libraries don't ship every book; omit both for
   * the full set.
   */
  router.get('/', timelineResponseSchema, async (respond, req) => {
    const user = requireUser(req);
    const { start, end } = req.query;
    const range = typeof start === 'string' && typeof end === 'string' ? { start, end } : undefined;
    respond(service.getTimeline(user.id, range));
  });

  return router.router;
}
