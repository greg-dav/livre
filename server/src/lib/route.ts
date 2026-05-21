import { z } from 'zod';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { isHttpError } from 'http-errors';

export type Respond<R> = (data: R, status?: number) => void;
export type BodylessHandler<R> = (
  respond: Respond<R>,
  req: Request,
  res: Response
) => void | Promise<void>;
export type BodyHandler<B, R> = (
  body: B,
  respond: Respond<R>,
  req: Request,
  res: Response
) => void | Promise<void>;

export const withBody =
  <B, R>(
    bodySchema: z.ZodType<B>,
    responseSchema: z.ZodType<R>,
    handler: BodyHandler<B, R>
  ): RequestHandler =>
  async (req, res, next) => {
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0]?.message ?? 'Invalid request' });
      return;
    }
    const respond: Respond<R> = (data, status = 200) =>
      res.status(status).json(responseSchema.parse(data));
    try {
      await handler(result.data, respond, req, res);
    } catch (err) {
      next(err);
    }
  };

export const withResponse =
  <R>(responseSchema: z.ZodType<R>, handler: BodylessHandler<R>): RequestHandler =>
  async (req, res, next) => {
    const respond: Respond<R> = (data, status = 200) =>
      res.status(status).json(responseSchema.parse(data));
    try {
      await handler(respond, req, res);
    } catch (err) {
      next(err);
    }
  };

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
