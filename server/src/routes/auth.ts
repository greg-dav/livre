import { Router } from 'express';
import {
  authResponseSchema,
  instanceStatusSchema,
  userSchema,
  registerBodySchema,
  loginBodySchema,
} from '@livre/types';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';
import { type AuthService } from '../services/AuthService';

export function createAuthRouter(service: AuthService): Router {
  const open = new SchemaRouter();
  const authed = new SchemaRouter().use(requireAuth);

  open.get('/status', instanceStatusSchema, (respond) => {
    respond(service.getStatus());
  });

  open.post(
    '/register',
    registerBodySchema,
    authResponseSchema,
    async ({ username, password }, respond) => {
      respond(await service.register(username, password), 201);
    }
  );

  open.post(
    '/login',
    loginBodySchema,
    authResponseSchema,
    async ({ username, password }, respond) => {
      respond(await service.login(username, password));
    }
  );

  authed.get('/me', userSchema, (respond, req) => {
    respond(userSchema.parse(req.user));
  });

  return Router().use(open.router).use(authed.router);
}
