import { Router, type RequestHandler } from 'express';
import { authContract } from '@livre/types';
import { server, attachContract, userOf, ok, created } from '../lib/tsRest';
import { type AuthService } from '../services/AuthService';

export function createAuthRouter(service: AuthService, requireAuth: RequestHandler): Router {
  const router = server.router(authContract, {
    status: async () => ok(service.getStatus()),

    register: async ({ body }) => created(await service.register(body.username, body.password)),

    login: async ({ body }) => ok(await service.login(body.username, body.password)),

    // The only guarded route in this contract, so requireAuth is attached here rather than globally.
    me: {
      middleware: [requireAuth],
      handler: async ({ req }) => ok(userOf(req)),
    },
  });

  const expressRouter = Router();
  attachContract(expressRouter, authContract, router);
  return expressRouter;
}
