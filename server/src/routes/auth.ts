import { Router, type RequestHandler } from 'express';
import {
  authResponseSchema,
  instanceStatusSchema,
  userSchema,
  registerBodySchema,
  loginBodySchema,
} from '@livre/types';
import { SchemaRouter } from '../lib/SchemaRouter';
import { type AuthService } from '../services/AuthService';

export function createAuthRouter(service: AuthService, requireAuth: RequestHandler): Router {
  const open = new SchemaRouter();
  const authed = new SchemaRouter().use(requireAuth);

  /** Return whether any user accounts exist, used to gate the setup vs login flow. */
  open.get('/status', instanceStatusSchema, (respond) => {
    respond(service.getStatus());
  });

  /** Register a new user account, validate the Google Books API key, and return a JWT. */
  open.post(
    '/register',
    registerBodySchema,
    authResponseSchema,
    async ({ username, password, googleBooksApiKey }, respond) => {
      respond(await service.register(username, password, googleBooksApiKey), 201);
    }
  );

  /** Validate credentials and issue a JWT. */
  open.post(
    '/login',
    loginBodySchema,
    authResponseSchema,
    async ({ username, password }, respond) => {
      respond(await service.login(username, password));
    }
  );

  /** Return the authenticated user's profile. */
  authed.get('/me', userSchema, (respond, req) => {
    respond(userSchema.parse(req.user));
  });

  return Router().use(open.router).use(authed.router);
}
