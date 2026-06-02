import { z } from 'zod';
import {
  userSchema,
  authResponseSchema,
  instanceStatusSchema,
  apiErrorSchema,
  bookVolumeSchema,
  bookSearchResponseSchema,
  searchResponseSchema,
  createLogEventResponseSchema,
  libraryBookDetailSchema,
  shelfResponseSchema,
  timelineResponseSchema,
  libraryResponseSchema,
  libraryTagsResponseSchema,
  updateTagsResponseSchema,
  updateDescriptionResponseSchema,
  updateCoverResponseSchema,
  updateTitleResponseSchema,
  updatePublisherResponseSchema,
  updatePageCountResponseSchema,
  updatePublishedDateResponseSchema,
  updateLanguageResponseSchema,
  updateIsbnResponseSchema,
  refreshMetadataResponseSchema,
  updateRatingResponseSchema,
  updateReviewResponseSchema,
  updateLogEntryResponseSchema,
  deleteLogEntryResponseSchema,
  okResponseSchema,
  usersListResponseSchema,
  managedUserSchema,
  type RefreshMetadataBody,
  type LogEventType,
  type BookFormat,
  type SearchScope,
  type SearchSort,
  type ShelfFilter,
  type ShelfStatus,
  type ThemeName,
  type CreateUserBody,
  type UpdateUserBody,
} from '@livre/types';

export type { User, ManagedUser, ThemeName } from '@livre/types';

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
    search: (
      q: string,
      options?: {
        scope?: SearchScope;
        shelf?: ShelfFilter;
        sort?: SearchSort;
        startIndex?: number;
      }
    ) => {
      const params = new URLSearchParams({ q });
      if (options?.scope) params.set('scope', options.scope);
      if (options?.shelf) params.set('shelf', options.shelf);
      if (options?.sort) params.set('sort', options.sort);
      if (options?.startIndex) params.set('startIndex', String(options.startIndex));
      return request(`/books/search?${params}`, searchResponseSchema);
    },
    searchQuick: (q: string) =>
      request(`/books/search/quick?q=${encodeURIComponent(q)}`, bookSearchResponseSchema),
    byAuthor: (name: string, options?: { sort?: SearchSort; startIndex?: number }) => {
      const params = new URLSearchParams();
      if (options?.sort) params.set('sort', options.sort);
      if (options?.startIndex) params.set('startIndex', String(options.startIndex));
      const qs = params.toString();
      return request(
        `/books/search/author/${encodeURIComponent(name)}${qs ? `?${qs}` : ''}`,
        searchResponseSchema
      );
    },
    getByRef: (bookRef: string) =>
      request(`/books/search/book/${encodeURIComponent(bookRef)}`, bookVolumeSchema),
    library: () => request('/books/library', libraryResponseSchema),
    libraryTags: () => request('/books/library/tags', libraryTagsResponseSchema),
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
    logByLibraryBookId: (
      libraryBookId: number,
      event: LogEventType,
      date?: string,
      text?: string,
      format?: BookFormat
    ) =>
      request(`/books/library/${libraryBookId}/log`, createLogEventResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ event, date, text, format }),
      }),
    updateTags: (libraryBookId: number, tags: string[]) =>
      request(`/books/library/${libraryBookId}/tags`, updateTagsResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ tags }),
      }),
    updateDescription: (libraryBookId: number, description: string) =>
      request(`/books/library/${libraryBookId}/description`, updateDescriptionResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
      }),
    updateCover: (libraryBookId: number, url: string) =>
      request(`/books/library/${libraryBookId}/cover`, updateCoverResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ url }),
      }),
    updateTitle: (libraryBookId: number, title: string) =>
      request(`/books/library/${libraryBookId}/title`, updateTitleResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    updatePublisher: (libraryBookId: number, publisher: string) =>
      request(`/books/library/${libraryBookId}/publisher`, updatePublisherResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ publisher }),
      }),
    updatePageCount: (libraryBookId: number, pageCount: number) =>
      request(`/books/library/${libraryBookId}/page-count`, updatePageCountResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ pageCount }),
      }),
    updatePublishedDate: (libraryBookId: number, publishedDate: string) =>
      request(`/books/library/${libraryBookId}/published-date`, updatePublishedDateResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ publishedDate }),
      }),
    updateLanguage: (libraryBookId: number, language: string) =>
      request(`/books/library/${libraryBookId}/language`, updateLanguageResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ language }),
      }),
    updateIsbn: (libraryBookId: number, isbn: string) =>
      request(`/books/library/${libraryBookId}/isbn`, updateIsbnResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ isbn }),
      }),
    refreshMetadata: (libraryBookId: number, fields: RefreshMetadataBody) =>
      request(`/books/library/${libraryBookId}/metadata`, refreshMetadataResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      }),
    updateRating: (libraryBookId: number, rating: number | null) =>
      request(`/books/library/${libraryBookId}/rating`, updateRatingResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
      }),
    updateReview: (libraryBookId: number, review: string) =>
      request(`/books/library/${libraryBookId}/review`, updateReviewResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ review }),
      }),
    logFormatChange: (libraryBookId: number, format: BookFormat) =>
      request(`/books/library/${libraryBookId}/log`, createLogEventResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ event: 'format', format }),
      }),
    updateLogEntry: (
      libraryBookId: number,
      logId: number,
      fields: { text?: string; date?: string }
    ) =>
      request(`/books/library/${libraryBookId}/log/${logId}`, updateLogEntryResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      }),
    deleteLogEntry: (libraryBookId: number, logId: number) =>
      request(`/books/library/${libraryBookId}/log/${logId}`, deleteLogEntryResponseSchema, {
        method: 'DELETE',
      }),
  },
  shelves: {
    getByStatus: (status: ShelfStatus) =>
      request(`/shelves/${encodeURIComponent(status)}`, shelfResponseSchema),
  },
  log: {
    timeline: (range?: { start: string; end: string }) =>
      request(
        range
          ? `/log?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
          : '/log',
        timelineResponseSchema
      ),
  },
  config: {
    updateGoogleBooksKey: (apiKey: string) =>
      request('/config/google-books-key', okResponseSchema, {
        method: 'PUT',
        body: JSON.stringify({ apiKey }),
      }),
  },
  account: {
    updateUsername: (username: string) =>
      request('/account/username', authResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ username }),
      }),
    updatePassword: (currentPassword: string, newPassword: string) =>
      request('/account/password', authResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    updateTheme: (theme: ThemeName) =>
      request('/account/theme', authResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify({ theme }),
      }),
  },
  users: {
    list: () => request('/users', usersListResponseSchema),
    create: (body: CreateUserBody) =>
      request('/users', managedUserSchema, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: number, body: UpdateUserBody) =>
      request(`/users/${id}`, managedUserSchema, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: number) =>
      request(`/users/${id}`, okResponseSchema, {
        method: 'DELETE',
      }),
  },
};
