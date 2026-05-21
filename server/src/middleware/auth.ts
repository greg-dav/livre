import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userSchema, type User } from '@livre/types';
import { env } from '../env';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    req.user = userSchema.parse(
      jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] })
    );
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user?.is_admin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  });
}
