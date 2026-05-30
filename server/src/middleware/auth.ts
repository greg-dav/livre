import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { userSchema, type User } from '@livre/types';
import { env } from '../env';
import { tokenClaimsSchema } from '../lib/token';
import { type UsersRepository } from '../repositories/UsersRepository';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthMiddleware {
  requireAuth: RequestHandler;
  requireAdmin: RequestHandler;
}

/**
 * Builds the auth guards against a users repository. Beyond verifying the JWT signature, requireAuth
 * confirms the token's version still matches the user's current `token_version` (and that the user
 * still exists), so deleted users and revoked sessions — from a password or role change — are
 * rejected immediately rather than lingering until the token's natural expiry.
 */
export const createAuthMiddleware = (users: UsersRepository): AuthMiddleware => {
  const requireAuth: RequestHandler = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const claims = tokenClaimsSchema.parse(
        jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] })
      );
      if (users.getTokenVersion(claims.id) !== claims.tv) {
        res.status(401).json({ error: 'Session expired' });
        return;
      }
      req.user = userSchema.parse(claims);
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const requireAdmin: RequestHandler = (req, res, next) => {
    requireAuth(req, res, () => {
      if (!req.user?.is_admin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    });
  };

  return { requireAuth, requireAdmin };
};
