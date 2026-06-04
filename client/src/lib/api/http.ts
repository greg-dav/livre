import { tsRestFetchApi, type ApiFetcherArgs } from '@ts-rest/core';
import { apiErrorSchema } from '@livre/types';

export const BASE = '/api';

/**
 * Shared fetcher for every ts-rest client: injects the bearer token and centralises the 401 →
 * sign-out behaviour the app relied on from the old hand-written `request()` helper.
 */
const fetchWithAuth = async (args: ApiFetcherArgs) => {
  const token = localStorage.getItem('livre_token');
  const res = await tsRestFetchApi({
    ...args,
    headers: { ...args.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem('livre_token');
    window.location.replace('/login');
    throw new Error('Unauthorized');
  }
  return res;
};

// Shared options for every per-domain initClient. `validateResponse` keeps the runtime response
// checks the old hand-written `request()` did (it parses the body against the contract's response
// schema and throws on a mismatch).
export const clientOpts = { api: fetchWithAuth, validateResponse: true } as const;

/**
 * Unwraps a ts-rest response to its success body, preserving the old throw-on-error contract so
 * call sites and React Query stay unchanged. Non-2xx bodies are read as our `{ error }` envelope.
 */
export function ok<T extends { status: number; body: unknown }>(
  res: T
): Extract<T, { status: 200 | 201 }>['body'] {
  if (res.status === 200 || res.status === 201) return res.body;
  const parsed = apiErrorSchema.safeParse(res.body);
  throw new Error(parsed.success ? parsed.data.error : `HTTP ${res.status}`);
}

/**
 * Token-injecting `fetch` with the same 401 → sign-out behaviour as the ts-rest clients, for the
 * non-JSON library transfer routes (file download / raw CSV upload) that bypass ts-rest. Throws
 * `Unauthorized` on a 401 and never resolves past it.
 */
export const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const token = localStorage.getItem('livre_token');
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem('livre_token');
    window.location.replace('/login');
    throw new Error('Unauthorized');
  }
  return res;
};
