import { Router, type RequestHandler } from 'express';
import { demoContract } from '@livre/types';
import { server, attachContract, ok } from '../lib/tsRest';
import { type DemoService } from '../services/DemoService';

/**
 * Demo-mode routes (guarded). `enter` is called from a real session to switch into the demo
 * sandbox; `reset` restores the demo library and is reachable from either the real or the demo
 * session, since it only ever rewrites the demo user's rows. Mounted at /api/demo.
 */
export function createDemoRouter(service: DemoService, requireAuth: RequestHandler): Router {
  const router = server.router(demoContract, {
    enter: async () => ok(service.enter()),

    reset: async () => {
      service.reset();
      return ok({ ok: true });
    },
  });

  const expressRouter = Router();
  expressRouter.use(requireAuth);
  attachContract(expressRouter, demoContract, router);
  return expressRouter;
}
