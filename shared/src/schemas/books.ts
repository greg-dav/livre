import { z } from 'zod';
import { shelfEntrySchema } from './shelves';

export const bookVolumeSchema = z.object({
  googleId: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  largeThumbnail: z.string().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().optional(),
  publisher: z.string().optional(),
  categories: z.array(z.string()),
  language: z.string().optional(),
});
export type BookVolume = z.infer<typeof bookVolumeSchema>;

export const bookSearchResultSchema = bookVolumeSchema;
export type BookSearchResult = BookVolume;

export const bookSearchResponseSchema = z.object({
  results: z.array(bookVolumeSchema),
  total: z.number(),
});
export type BookSearchResponse = z.infer<typeof bookSearchResponseSchema>;

export const libraryBookDetailSchema = z.object({
  entry: shelfEntrySchema,
  book: bookVolumeSchema,
});
export type LibraryBookDetail = z.infer<typeof libraryBookDetailSchema>;
