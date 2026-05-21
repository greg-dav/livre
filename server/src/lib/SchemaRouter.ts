import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { withBody, withResponse } from './route';
import type { BodylessHandler, BodyHandler } from './route';

/**
 * Wraps an Express Router with typed route methods. Schemas are declared inline alongside the
 * path — callers never touch withBody/withResponse directly. Apply middleware via use() before
 * registering routes. Expose .router for app.use() mounting.
 */
export class SchemaRouter {
  readonly router = Router();

  use(...middleware: RequestHandler[]): this {
    this.router.use(...middleware);
    return this;
  }

  get<R>(path: string, schema: z.ZodType<R>, handler: BodylessHandler<R>): this {
    this.router.get(path, withResponse(schema, handler));
    return this;
  }

  post<B, R>(
    path: string,
    body: z.ZodType<B>,
    response: z.ZodType<R>,
    handler: BodyHandler<B, R>
  ): this {
    this.router.post(path, withBody(body, response, handler));
    return this;
  }

  put<B, R>(
    path: string,
    body: z.ZodType<B>,
    response: z.ZodType<R>,
    handler: BodyHandler<B, R>
  ): this {
    this.router.put(path, withBody(body, response, handler));
    return this;
  }

  patch<B, R>(
    path: string,
    body: z.ZodType<B>,
    response: z.ZodType<R>,
    handler: BodyHandler<B, R>
  ): this {
    this.router.patch(path, withBody(body, response, handler));
    return this;
  }

  delete<R>(path: string, schema: z.ZodType<R>, handler: BodylessHandler<R>): this {
    this.router.delete(path, withResponse(schema, handler));
    return this;
  }
}
