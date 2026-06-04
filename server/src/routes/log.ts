import { type Router, type RequestHandler } from 'express';
import { logContract } from '@livre/types';
import { server, mountContract, userOf, ok } from '../lib/tsRest';
import { type LogService } from '../services/LogService';

export function createLogRouter(service: LogService, requireAuth: RequestHandler): Router {
  const router = server.router(logContract, {
    timeline: async ({ query, req }) => {
      const range = query.start && query.end ? { start: query.start, end: query.end } : undefined;
      return ok(service.getTimeline(userOf(req).id, range));
    },
  });

  return mountContract(logContract, router, requireAuth);
}
