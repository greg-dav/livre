import { initClient } from '@ts-rest/core';
import {
  libraryContract,
  apiErrorSchema,
  importResultSchema,
  type BookSource,
  type BookFormat,
  type LogEventType,
  type CreateLogEventBody,
  type UpdateMetadataBody,
  type ShelfStatus,
} from '@livre/types';
import { BASE, clientOpts, ok, authFetch } from './http';

const client = initClient(libraryContract, { ...clientOpts, baseUrl: `${BASE}/library` });

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

export const library = {
  list: () => client.getLibrary().then(ok),
  tags: () => client.getTags().then(ok),
  shelf: (status: ShelfStatus) => client.getShelf({ params: { status } }).then(ok),
  book: (libraryBookId: number) => client.getLibraryBook({ params: { libraryBookId } }).then(ok),
  add: (bookRef: string, event: LogEventType, date?: string) =>
    client.add({ body: { bookRef, ...logBody(event, date) } }).then(ok),
  log: (
    libraryBookId: number,
    event: LogEventType,
    date?: string,
    text?: string,
    format?: BookFormat
  ) =>
    client
      .logEvent({ params: { libraryBookId }, body: logBody(event, date, text, format) })
      .then(ok),
  updateTags: (libraryBookId: number, tags: string[]) =>
    client.updateTags({ params: { libraryBookId }, body: { tags } }).then(ok),
  updateMetadata: (libraryBookId: number, fields: UpdateMetadataBody) =>
    client.updateMetadata({ params: { libraryBookId }, body: fields }).then(ok),
  updateRating: (libraryBookId: number, rating: number | null) =>
    client.updateRating({ params: { libraryBookId }, body: { rating } }).then(ok),
  updateReview: (libraryBookId: number, review: string) =>
    client.updateReview({ params: { libraryBookId }, body: { review } }).then(ok),
  logFormatChange: (libraryBookId: number, format: BookFormat) =>
    client.logEvent({ params: { libraryBookId }, body: { event: 'format', format } }).then(ok),
  updateLogEntry: (
    libraryBookId: number,
    logId: number,
    fields: { text?: string; date?: string }
  ) => client.updateLogEntry({ params: { libraryBookId, logId }, body: fields }).then(ok),
  deleteLogEntry: (libraryBookId: number, logId: number) =>
    client.deleteLogEntry({ params: { libraryBookId, logId } }).then(ok),
  resetReadingLog: (libraryBookId: number) =>
    client.resetReadingLog({ params: { libraryBookId }, body: {} }).then(ok),
  removeFromLibrary: (libraryBookId: number) =>
    client.removeFromLibrary({ params: { libraryBookId } }).then(ok),
  deleteLibrary: () => client.deleteLibrary().then(ok),
  listFormats: () => client.getFormats().then(ok),
  importSources: () => client.getImportSources().then(ok),
  // File download bypasses the JSON clients: the response is a file attachment, so we hand back the
  // raw blob and server-supplied filename for the caller to save.
  exportLibrary: async (formatId: string): Promise<{ filename: string; blob: Blob }> => {
    const res = await authFetch(`${BASE}/library/export?format=${encodeURIComponent(formatId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const match = (res.headers.get('Content-Disposition') ?? '').match(/filename="?([^"]+)"?/);
    return { filename: match?.[1] ?? 'livre-library.csv', blob: await res.blob() };
  },
  // The file's text is read in the browser and POSTed as the raw body to a non-JSON route, so this
  // bypasses the ts-rest client too.
  importLibrary: async (formatId: string, file: File, source: BookSource) => {
    const content = await file.text();
    const params = new URLSearchParams({ format: formatId, source });
    const res = await authFetch(`${BASE}/library/import?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: content,
    });
    if (!res.ok) {
      const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
      throw new Error(parsed.success ? parsed.data.error : `HTTP ${res.status}`);
    }
    return importResultSchema.parse(await res.json());
  },
};
