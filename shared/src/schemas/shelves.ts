import { z } from 'zod';
import { bookRefSchema } from './bookRef';

export const shelfStatusSchema = z.enum(['want', 'reading', 'read', 'dnf']);
export type ShelfStatus = z.infer<typeof shelfStatusSchema>;

export const logEventTypeSchema = z.enum([
  'shelved',
  'started',
  'finished',
  'dnf',
  'restarted',
  'note',
]);
export type LogEventType = z.infer<typeof logEventTypeSchema>;

export const shelfEntrySchema = z.object({
  libraryBookId: z.number(),
  status: shelfStatusSchema,
  startedDate: z.string().nullable(),
  rating: z.number().nullable(),
  review: z.string().nullable(),
  addedDate: z.string(),
  // Nullable to support future manual entries with no upstream source.
  bookRef: bookRefSchema.nullable(),
  title: z.string(),
  authors: z.array(z.string()),
  coverUrl: z.string().nullable(),
});
export type ShelfEntry = z.infer<typeof shelfEntrySchema>;

export const shelfCountsSchema = z.object({
  want: z.number(),
  reading: z.number(),
  read: z.number(),
  dnf: z.number(),
});
export type ShelfCounts = z.infer<typeof shelfCountsSchema>;

export const shelfResponseSchema = z.object({
  entries: z.array(shelfEntrySchema),
  counts: shelfCountsSchema,
});
export type ShelfResponse = z.infer<typeof shelfResponseSchema>;

export const createLogEventBodySchema = z.object({
  event: logEventTypeSchema,
  date: z.string().optional(),
});
export type CreateLogEventBody = z.infer<typeof createLogEventBodySchema>;

export const createLogEventResponseSchema = z.object({
  libraryBookId: z.number(),
  logId: z.number(),
});
export type CreateLogEventResponse = z.infer<typeof createLogEventResponseSchema>;

export const libraryResponseSchema = z.array(shelfEntrySchema);
export type LibraryResponse = z.infer<typeof libraryResponseSchema>;

export const logEntrySchema = z.object({
  id: z.number(),
  event: logEventTypeSchema,
  date: z.string(),
  note: z.string().nullable(),
});
export type LogEntry = z.infer<typeof logEntrySchema>;
