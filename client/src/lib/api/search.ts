import { initClient } from '@ts-rest/core';
import { searchContract, type SearchScope, type SearchSort, type ShelfFilter } from '@livre/types';
import { BASE, clientOpts, ok } from './http';

const client = initClient(searchContract, { ...clientOpts, baseUrl: `${BASE}/search` });

export const search = {
  search: (
    q: string,
    options?: {
      scope?: SearchScope;
      shelf?: ShelfFilter;
      sort?: SearchSort;
      startIndex?: number;
    }
  ) =>
    client
      .search({
        query: {
          q,
          scope: options?.scope,
          shelf: options?.shelf,
          sort: options?.sort,
          startIndex: options?.startIndex,
        },
      })
      .then(ok),
  searchQuick: (q: string) => client.quickSearch({ query: { q } }).then(ok),
  byAuthor: (name: string, options?: { sort?: SearchSort; startIndex?: number }) =>
    client
      .authorBooks({
        // ts-rest inserts path params verbatim, so encode the free-text author name ourselves to
        // guard against special characters (e.g. a slash) that fetch wouldn't escape in a path.
        params: { name: encodeURIComponent(name) },
        query: { sort: options?.sort, startIndex: options?.startIndex },
      })
      .then(ok),
  getByRef: (bookRef: string) => client.getBook({ params: { bookRef } }).then(ok),
};
