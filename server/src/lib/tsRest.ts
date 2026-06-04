import { Router, type RequestHandler } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import type { AppRouter } from '@ts-rest/core';
import createError from 'http-errors';
import { type User } from '@livre/types';

/** Shared ts-rest server instance — handlers are built with `server.router(contract, {...})`. */
export const server = initServer();

// RouterImplementation isn't exported from @ts-rest/express, so derive the handler-map type from
// createExpressEndpoints' own second parameter.
type RouterImpl<T extends AppRouter> = Parameters<typeof createExpressEndpoints<T>>[1];

/**
 * Reads the authenticated user off a ts-rest handler's request. ts-rest's `TsRestRequest` narrows
 * `params`/`query` to their parsed shapes, so it isn't assignable to Express's `Request` and the
 * Express-typed `assertAuthed` won't take it — this structural reader sidesteps that. The auth guard
 * mounted on the router guarantees `user` is present, so the throw is a defensive invariant.
 */
export const userOf = (req: { user?: User }): User => {
  if (!req.user) throw createError(401, 'Unauthorized');
  return req.user;
};

// Response builders — keep handlers to one expressive line instead of repeating `{ status, body }`.
// `const B` preserves literal bodies (e.g. `{ ok: true }`) that a contract response type requires,
// and the annotated status stays a literal (a ts-rest response is discriminated by it) — no `as`.
export const ok = <const B>(body: B): { status: 200; body: B } => ({ status: 200, body });
export const created = <const B>(body: B): { status: 201; body: B } => ({ status: 201, body });
export const notFound = (error: string): { status: 404; body: { error: string } } => ({
  status: 404,
  body: { error },
});

/**
 * Registers a ts-rest contract's endpoints on an existing Express router, remapping ts-rest's
 * default `{ name, issues }` validation body to our app-wide `{ error }` envelope in one place.
 * Use this (rather than mountContract) when a router needs to interleave plain Express handlers —
 * e.g. the non-JSON export/import routes — before the contract routes for matching-order reasons.
 */
export function attachContract<T extends AppRouter>(
  expressRouter: Router,
  contract: T,
  router: RouterImpl<T>
): void {
  createExpressEndpoints(contract, router, expressRouter, {
    logInitialization: false,
    // Validate responses against the contract too — restores the safety net the old SchemaRouter
    // had (it parsed every response), so a handler emitting a body that doesn't match the contract
    // fails loudly on the server instead of shipping a malformed 200.
    responseValidation: true,
    requestValidationErrorHandler: (err, _req, res) => {
      const issue =
        err.pathParams?.issues[0] ??
        err.query?.issues[0] ??
        err.body?.issues[0] ??
        err.headers?.issues[0];
      res.status(400).json({ error: issue?.message ?? 'Invalid request' });
    },
  });
}

/**
 * Mounts a ts-rest contract + its handlers behind an auth guard. Contracts use paths relative to
 * their mount point (e.g. `/username`), so the returned router is mounted by the caller at the
 * domain prefix (`/api/account`), which keeps the guard scoped to that prefix.
 */
export function mountContract<T extends AppRouter>(
  contract: T,
  router: RouterImpl<T>,
  guard: RequestHandler
): Router {
  const expressRouter = Router();
  expressRouter.use(guard);
  attachContract(expressRouter, contract, router);
  return expressRouter;
}
