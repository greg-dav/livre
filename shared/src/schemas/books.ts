import { z } from 'zod';

export const bookSearchResultSchema = z.object({
  googleId: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().optional(),
  publisher: z.string().optional(),
  categories: z.array(z.string()),
  language: z.string().optional(),
});

export const bookSearchResponseSchema = z.object({
  results: z.array(bookSearchResultSchema),
  total: z.number(),
});

export type BookSearchResult = z.infer<typeof bookSearchResultSchema>;
export type BookSearchResponse = z.infer<typeof bookSearchResponseSchema>;
