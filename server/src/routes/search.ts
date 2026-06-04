import { searchContract } from '@livre/types';
import { type RequestHandler, type Router } from 'express';
import createError from 'http-errors';
import { server, mountContract, userOf, ok } from '../lib/tsRest';
import { decodeBookRef } from '../lib/bookRef';
import { type SearchService } from '../services/SearchService';

const decodeRef = (
  raw: string
): { source: import('@livre/types').BookSource; externalId: string } => {
  try {
    return decodeBookRef(raw);
  } catch {
    throw createError(400, 'Invalid book reference');
  }
};

export function createSearchRouter(service: SearchService, requireAuth: RequestHandler): Router {
  const router = server.router(searchContract, {
    search: async ({ query, req }) =>
      ok(
        await service.search(
          userOf(req).id,
          query.q,
          query.scope,
          query.shelf,
          query.sort,
          query.startIndex
        )
      ),

    quickSearch: async ({ query }) => ok(await service.quickSearch(query.q)),

    authorBooks: async ({ params, query, req }) =>
      ok(await service.getAuthorBooks(userOf(req).id, params.name, query.sort, query.startIndex)),

    getBook: async ({ params }) => {
      const { source, externalId } = decodeRef(params.bookRef);
      return ok(await service.getById(source, externalId));
    },
  });

  return mountContract(searchContract, router, requireAuth);
}
