import { type Router, type RequestHandler } from 'express';
import { shelvesContract } from '@livre/types';
import { server, mountContract, userOf, ok } from '../lib/tsRest';
import { type BooksService } from '../services/BooksService';

export function createShelvesRouter(service: BooksService, requireAuth: RequestHandler): Router {
  const router = server.router(shelvesContract, {
    getShelf: async ({ params, req }) => ok(service.getShelf(userOf(req).id, params.status)),
  });

  return mountContract(shelvesContract, router, requireAuth);
}
