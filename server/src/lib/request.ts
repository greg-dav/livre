import { z } from 'zod';
import type { Request } from 'express';
import createError from 'http-errors';
import { userSchema, type User } from '@livre/types';

/**
 * Narrows `req.user` to a `User` behind an auth guard. The guard (`requireAuth`) already populates
 * it, so the throw is a defensive invariant that can't fire in practice — it lets handlers drop the
 * repetitive null check while keeping the type honest.
 */
export const requireUser = (req: Request): User => {
  if (!req.user) throw createError(401, 'Unauthorized');
  return userSchema.parse(req.user);
};

/** Coerce a positive-integer route param (book/log ids), throwing a 400 on anything else. */
export const idParam = (req: Request, name: string): number =>
  z.coerce.number().int().positive().parse(req.params[name]);
