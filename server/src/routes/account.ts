import { type Router, type RequestHandler } from 'express';
import { accountContract } from '@livre/types';
import { server, mountContract, userOf, ok } from '../lib/tsRest';
import { type AccountService } from '../services/AccountService';

export function createAccountRouter(service: AccountService, requireAuth: RequestHandler): Router {
  const router = server.router(accountContract, {
    me: async ({ req }) => ok(userOf(req)),

    updateUsername: async ({ body, req }) =>
      ok(service.updateUsername(userOf(req).id, body.username)),

    updatePassword: async ({ body, req }) =>
      ok(await service.updatePassword(userOf(req).id, body.currentPassword, body.newPassword)),

    updateTheme: async ({ body, req }) => ok(service.updateTheme(userOf(req).id, body.theme)),
  });

  return mountContract(accountContract, router, requireAuth);
}
