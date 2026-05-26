import { z } from 'zod';
import {
  userSchema,
  authResponseSchema,
  instanceStatusSchema,
  apiErrorSchema,
  bookVolumeSchema,
  bookSearchResponseSchema,
  createLogEventResponseSchema,
  libraryBookDetailSchema,
  shelfResponseSchema,
  libraryResponseSchema,
  updateApiKeyResponseSchema,
  updateTagsResponseSchema,
  type LogEventType,
  type ShelfStatus,
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
      request(`/books/search/author/${encodeURIComponent(name)}`, bookSearchResponseSchema),
    getByRef: (bookRef: string) =>
      request(`/books/search/book/${encodeURIComponent(bookRef)}`, bookVolumeSchema),
    library: () => request('/books/library', libraryResponseSchema),
    libraryBook: (libraryBookId: number) =>
      request(`/books/library/${libraryBookId}`, libraryBookDetailSchema),
    addToLibrary: (bookRef: string, event: LogEventType, date?: string) =>
      request(
        `/books/search/book/${encodeURIComponent(bookRef)}/add`,
        createLogEventResponseSchema,
        {
          method: 'POST',
          body: JSON.stringify({ event, date }),
        }
      ),
    logByLibraryBookId: (libraryBookId: number, event: LogEventType, date?: string) =>
      request(`/books/library/${libraryBookId}/log`, createLogEventResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ event, date }),
      }),
    updateTags: (libraryBookId: number, tags: string[]) =>
      request(`/books/library/${libraryBookId}/tags`, updateTagsResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ tags }),
      }),
  },
  shelves: {
    getByStatus: (status: ShelfStatus) =>
      request(`/shelves/${encodeURIComponent(status)}`, shelfResponseSchema),
  },
  config: {
    updateGoogleBooksKey: (apiKey: string) =>
      request('/config/google-books-key', updateApiKeyResponseSchema, {
        method: 'PUT',
        body: JSON.stringify({ apiKey }),
      }),
  },
};
