import { z } from 'zod';
import { bookRefSchema } from './bookRef';
import { logEntrySchema } from './reading';

/**
 * A single reading cycle — one continuous read of a book, derived from the event log. A book read
 * more than once has multiple cycles; the timeline renders one bar per cycle. `end` is null while
 * the cycle is still open (status `reading`). `events` are the note/quote/format/landmark entries
 * that belong to this cycle.
 */
export const timelineCycleSchema = z.object({
  start: z.string(),
  end: z.string().nullable(),
  status: z.enum(['reading', 'read', 'dnf']),
  events: z.array(logEntrySchema),
});
export type TimelineCycle = z.infer<typeof timelineCycleSchema>;

/**
 * One book on the timeline: its metadata plus the cycles derived from its reading log. `bookRef`
 * is nullable for manual entries; the client stays source-blind. `shelvedDate` marks when the book
 * was added (the pre-first-cycle "Added" landmark), independent of any cycle.
 */
export const timelineBookSchema = z.object({
  libraryBookId: z.number(),
  bookRef: bookRefSchema.nullable(),
  title: z.string(),
  authors: z.array(z.string()),
  coverUrl: z.string().nullable(),
  rating: z.number().nullable(),
  addedDate: z.string(),
  shelvedDate: z.string().nullable(),
  cycles: z.array(timelineCycleSchema),
});
export type TimelineBook = z.infer<typeof timelineBookSchema>;
