import { z } from 'zod';

export const shelfStatusSchema = z.enum(['want', 'reading', 'read', 'dnf']);
export type ShelfStatus = z.infer<typeof shelfStatusSchema>;

export const shelfEntrySchema = z.object({
  userBookId: z.number(),
  status: shelfStatusSchema,
  rating: z.number().nullable(),
  review: z.string().nullable(),
  addedDate: z.string(),
  googleId: z.string().nullable(),
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

export const saveBookBodySchema = z.object({
  status: shelfStatusSchema,
});
export type SaveBookBody = z.infer<typeof saveBookBodySchema>;

export const saveBookResponseSchema = z.object({
  userBookId: z.number(),
  status: shelfStatusSchema,
});
export type SaveBookResponse = z.infer<typeof saveBookResponseSchema>;

export const libraryEntrySchema = z.object({
  googleId: z.string(),
  status: shelfStatusSchema,
});
export type LibraryEntry = z.infer<typeof libraryEntrySchema>;

export const libraryResponseSchema = z.array(shelfEntrySchema);
export type LibraryResponse = z.infer<typeof libraryResponseSchema>;
