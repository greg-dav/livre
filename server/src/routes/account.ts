import { Router, type RequestHandler } from 'express';
import {
  authResponseSchema,
  updatePasswordBodySchema,
  updateThemeBodySchema,
  updateUsernameBodySchema,
  userSchema,
} from '@livre/types';
import { SchemaRouter } from '../lib/SchemaRouter';
import { type AccountService } from '../services/AccountService';

export function createAccountRouter(service: AccountService, requireAuth: RequestHandler): Router {
  const authed = new SchemaRouter().use(requireAuth);

  /** Change the authenticated user's username; re-issues the JWT to reflect the new name. */
  authed.patch(
    '/username',
    updateUsernameBodySchema,
    authResponseSchema,
    ({ username }, respond, req) => {
      respond(service.updateUsername(userSchema.parse(req.user).id, username));
    }
  );

  /**
   * Change the authenticated user's password after verifying their current one. Returns a fresh
   * token: the change revokes all of the user's other sessions, so the acting client needs the new
   * token to stay signed in.
   */
  authed.patch(
    '/password',
    updatePasswordBodySchema,
    authResponseSchema,
    async ({ currentPassword, newPassword }, respond, req) => {
      respond(
        await service.updatePassword(userSchema.parse(req.user).id, currentPassword, newPassword)
      );
    }
  );

  /** Persist the authenticated user's theme; re-issues the JWT to reflect the new theme. */
  authed.patch('/theme', updateThemeBodySchema, authResponseSchema, ({ theme }, respond, req) => {
    respond(service.updateTheme(userSchema.parse(req.user).id, theme));
  });

  return authed.router;
}
