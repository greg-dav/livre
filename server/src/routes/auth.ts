import { Router } from 'express';
import { authContract } from '@livre/types';
import { server, attachContract, ok, created } from '../lib/tsRest';
import { type AuthService } from '../services/AuthService';

export function createAuthRouter(service: AuthService): Router {
  const router = server.router(authContract, {
    status: async () => ok(service.getStatus()),

    register: async ({ body }) => created(await service.register(body.username, body.password)),

    login: async ({ body }) => ok(await service.login(body.username, body.password)),
  });

  const expressRouter = Router();
  attachContract(expressRouter, authContract, router);
  return expressRouter;
}
