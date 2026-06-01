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
  'quote',
  'format',
]);
export type LogEventType = z.infer<typeof logEventTypeSchema>;

export const bookFormatSchema = z.enum(['physical', 'ereader', 'audio']);
export type BookFormat = z.infer<typeof bookFormatSchema>;

export const shelfEntrySchema = z.object({
  libraryBookId: z.number(),
  status: shelfStatusSchema,
  startedDate: z.string().nullable(),
  rating: z.number().nullable(),
  review: z.string().nullable(),
  addedDate: z.string(),
  bookRef: bookRefSchema.nullable(),
  title: z.string(),
  authors: z.array(z.string()),
  coverUrl: z.string().nullable(),
  tags: z.array(z.string()),
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

export const createLogEventBodySchema = z.union([
  z.object({
    event: z.enum(['shelved', 'started', 'restarted', 'finished', 'dnf']),
    date: z.string().optional(),
  }),
  z.object({ event: z.enum(['note', 'quote']), date: z.string().optional(), text: z.string() }),
  z.object({ event: z.literal('format'), date: z.string().optional(), format: bookFormatSchema }),
]);
export type CreateLogEventBody = z.infer<typeof createLogEventBodySchema>;

export const createLogEventResponseSchema = z.object({
  libraryBookId: z.number(),
  logId: z.number(),
});
export type CreateLogEventResponse = z.infer<typeof createLogEventResponseSchema>;

export const libraryResponseSchema = z.array(shelfEntrySchema);
export type LibraryResponse = z.infer<typeof libraryResponseSchema>;

export const logEntrySchema = z.union([
  z.object({
    id: z.number(),
    event: z.enum(['shelved', 'started', 'restarted', 'finished', 'dnf']),
    date: z.string(),
  }),
  z.object({
    id: z.number(),
    event: z.enum(['note', 'quote']),
    date: z.string(),
    text: z.string(),
  }),
  z.object({
    id: z.number(),
    event: z.literal('format'),
    date: z.string(),
    format: bookFormatSchema,
  }),
]);
export type LogEntry = z.infer<typeof logEntrySchema>;
