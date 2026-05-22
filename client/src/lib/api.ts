import { z } from 'zod';
import {
  userSchema,
  authResponseSchema,
  instanceStatusSchema,
  apiErrorSchema,
  bookSearchResponseSchema,
  bookSearchResultSchema,
} from '@livre/types';

export type { User } from '@livre/types';

const BASE = '/api';

async function request<T>(path: string, schema: z.ZodType<T>, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('livre_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('livre_token');
    window.location.replace('/login');
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
    throw new Error(parsed.success ? parsed.data.error : `HTTP ${res.status}`);
  }

  return schema.parse(await res.json());
}

export const api = {
  auth: {
    status: () => request('/auth/status', instanceStatusSchema),
    register: (username: string, password: string, googleBooksApiKey: string) =>
      request('/auth/register', authResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ username, password, googleBooksApiKey }),
      }),
    login: (username: string, password: string) =>
      request('/auth/login', authResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request('/auth/me', userSchema),
  },
  books: {
    search: (q: string) =>
      request(`/books/search?q=${encodeURIComponent(q)}`, bookSearchResponseSchema),
    byAuthor: (name: string) =>
      request(`/books/author/${encodeURIComponent(name)}`, bookSearchResponseSchema),
    getById: (id: string) => request(`/books/${encodeURIComponent(id)}`, bookSearchResultSchema),
  },
};
