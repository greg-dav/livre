import { initClient, tsRestFetchApi, type ApiFetcherArgs } from '@ts-rest/core';
import {
  apiErrorSchema,
  importResultSchema,
  accountContract,
  authContract,
  usersContract,
  logContract,
  shelvesContract,
  booksContract,
  configContract,
  type BookSource,
  type CreateLogEventBody,
  type UpdateMetadataBody,
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

// validateResponse keeps the runtime response checks the old hand-written `request()` did
// (it parses the body against the contract's response schema and throws on a mismatch).
const opts = { api: fetchWithAuth, validateResponse: true };
const authClient = initClient(authContract, { ...opts, baseUrl: `${BASE}/auth` });
const accountClient = initClient(accountContract, { ...opts, baseUrl: `${BASE}/account` });
const usersClient = initClient(usersContract, { ...opts, baseUrl: `${BASE}/users` });
const logClient = initClient(logContract, { ...opts, baseUrl: `${BASE}/log` });
const shelvesClient = initClient(shelvesContract, { ...opts, baseUrl: `${BASE}/shelves` });
const booksClient = initClient(booksContract, { ...opts, baseUrl: `${BASE}/books` });
const configClient = initClient(configContract, { ...opts, baseUrl: `${BASE}/config` });

/**
 * Unwraps a ts-rest response to its success body, preserving the old throw-on-error contract so
 * call sites and React Query stay unchanged. Non-2xx bodies are read as our `{ error }` envelope.
 */
function ok<T extends { status: number; body: unknown }>(
  res: T
): Extract<T, { status: 200 | 201 }>['body'] {
  if (res.status === 200 || res.status === 201) return res.body;
  const parsed = apiErrorSchema.safeParse(res.body);
  throw new Error(parsed.success ? parsed.data.error : `HTTP ${res.status}`);
}

/** Narrows a broad LogEventType + optional fields into the discriminated event body. */
const logBody = (
  event: LogEventType,
  date?: string,
  text?: string,
  format?: BookFormat
): CreateLogEventBody => {
  if (event === 'note' || event === 'quote') return { event, date, text: text ?? '' };
  if (event === 'format') return { event, date, format: format ?? 'physical' };
  return { event, date };
};

export const api = {
  auth: {
    status: () => authClient.status().then(ok),
    register: (username: string, password: string) =>
      authClient.register({ body: { username, password } }).then(ok),
    login: (username: string, password: string) =>
      authClient.login({ body: { username, password } }).then(ok),
    me: () => authClient.me().then(ok),
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
    ) =>
      booksClient
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
    searchQuick: (q: string) => booksClient.quickSearch({ query: { q } }).then(ok),
    byAuthor: (name: string, options?: { sort?: SearchSort; startIndex?: number }) =>
      booksClient
        .authorBooks({
          // ts-rest inserts path params verbatim, so encode the free-text author name ourselves to
          // guard against special characters (e.g. a slash) that fetch wouldn't escape in a path.
          params: { name: encodeURIComponent(name) },
          query: { sort: options?.sort, startIndex: options?.startIndex },
        })
        .then(ok),
    getByRef: (bookRef: string) => booksClient.getBook({ params: { bookRef } }).then(ok),
    library: () => booksClient.getLibrary().then(ok),
    libraryTags: () => booksClient.getTags().then(ok),
    libraryBook: (libraryBookId: number) =>
      booksClient.getLibraryBook({ params: { libraryBookId } }).then(ok),
    addToLibrary: (bookRef: string, event: LogEventType, date?: string) =>
      booksClient.addToLibrary({ params: { bookRef }, body: logBody(event, date) }).then(ok),
    logByLibraryBookId: (
      libraryBookId: number,
      event: LogEventType,
      date?: string,
      text?: string,
      format?: BookFormat
    ) =>
      booksClient
        .logEvent({ params: { libraryBookId }, body: logBody(event, date, text, format) })
        .then(ok),
    updateTags: (libraryBookId: number, tags: string[]) =>
      booksClient.updateTags({ params: { libraryBookId }, body: { tags } }).then(ok),
    updateMetadata: (libraryBookId: number, fields: UpdateMetadataBody) =>
      booksClient.updateMetadata({ params: { libraryBookId }, body: fields }).then(ok),
    updateRating: (libraryBookId: number, rating: number | null) =>
      booksClient.updateRating({ params: { libraryBookId }, body: { rating } }).then(ok),
    updateReview: (libraryBookId: number, review: string) =>
      booksClient.updateReview({ params: { libraryBookId }, body: { review } }).then(ok),
    logFormatChange: (libraryBookId: number, format: BookFormat) =>
      booksClient
        .logEvent({ params: { libraryBookId }, body: { event: 'format', format } })
        .then(ok),
    updateLogEntry: (
      libraryBookId: number,
      logId: number,
      fields: { text?: string; date?: string }
    ) => booksClient.updateLogEntry({ params: { libraryBookId, logId }, body: fields }).then(ok),
    deleteLogEntry: (libraryBookId: number, logId: number) =>
      booksClient.deleteLogEntry({ params: { libraryBookId, logId } }).then(ok),
    resetReadingLog: (libraryBookId: number) =>
      booksClient.resetReadingLog({ params: { libraryBookId }, body: {} }).then(ok),
    removeFromLibrary: (libraryBookId: number) =>
      booksClient.removeFromLibrary({ params: { libraryBookId } }).then(ok),
    deleteLibrary: () => booksClient.deleteLibrary().then(ok),
    listFormats: () => booksClient.getFormats().then(ok),
    importSources: () => booksClient.getImportSources().then(ok),
    // File download bypasses the JSON clients: the response is a file attachment, so we hand back the
    // raw blob and server-supplied filename for the caller to save.
    exportLibrary: async (formatId: string): Promise<{ filename: string; blob: Blob }> => {
      const token = localStorage.getItem('livre_token');
      const res = await fetch(
        `${BASE}/books/library/export?format=${encodeURIComponent(formatId)}`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      if (res.status === 401) {
        localStorage.removeItem('livre_token');
        window.location.replace('/login');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const match = (res.headers.get('Content-Disposition') ?? '').match(/filename="?([^"]+)"?/);
      return { filename: match?.[1] ?? 'livre-library.csv', blob: await res.blob() };
    },
    // The file's text is read in the browser and POSTed as the raw body to a non-JSON route, so this
    // bypasses the ts-rest client too.
    importLibrary: async (formatId: string, file: File, source: BookSource) => {
      const content = await file.text();
      const params = new URLSearchParams({ format: formatId, source });
      const token = localStorage.getItem('livre_token');
      const res = await fetch(`${BASE}/books/library/import?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: content,
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
      return importResultSchema.parse(await res.json());
    },
  },
  shelves: {
    getByStatus: (status: ShelfStatus) => shelvesClient.getShelf({ params: { status } }).then(ok),
  },
  log: {
    timeline: (range?: { start: string; end: string }) =>
      logClient.timeline({ query: range ?? {} }).then(ok),
  },
  config: {
    updateSourceKey: (source: BookSource, apiKey: string) =>
      configClient.updateApiKey({ params: { source }, body: { apiKey } }).then(ok),
    updateSourceLimit: (source: BookSource, limit: number) =>
      configClient.updateDailyLimit({ params: { source }, body: { limit } }).then(ok),
  },
  account: {
    updateUsername: (username: string) =>
      accountClient.updateUsername({ body: { username } }).then(ok),
    updatePassword: (currentPassword: string, newPassword: string) =>
      accountClient.updatePassword({ body: { currentPassword, newPassword } }).then(ok),
    updateTheme: (theme: ThemeName) => accountClient.updateTheme({ body: { theme } }).then(ok),
  },
  users: {
    list: () => usersClient.list().then(ok),
    create: (body: CreateUserBody) => usersClient.create({ body }).then(ok),
    update: (id: number, body: UpdateUserBody) =>
      usersClient.update({ params: { id }, body }).then(ok),
    remove: (id: number) => usersClient.remove({ params: { id } }).then(ok),
  },
};
