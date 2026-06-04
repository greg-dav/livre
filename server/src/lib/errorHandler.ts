import type { Request, Response, NextFunction } from 'express';
import { isHttpError } from 'http-errors';

/**
 * Terminal Express error handler. http-errors (e.g. `createError(404, ...)` thrown from a service or
 * route) map to their status with our `{ error }` envelope; anything else is logged and returned as
 * a 500. ts-rest request-validation errors are remapped earlier, in `attachContract`.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) return;
  if (isHttpError(err)) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
