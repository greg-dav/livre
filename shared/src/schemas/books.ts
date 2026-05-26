import { z } from 'zod';
import { bookRefSchema } from './bookRef';
import { shelfEntrySchema, logEntrySchema } from './shelves';

export { bookSourceSchema, bookRefSchema } from './bookRef';
export type { BookSource } from './bookRef';

export const bookGenreSchema = z.enum([
  'antiques-collectibles',
  'architecture',
  'art',
  'bibles',
  'biography-autobiography',
  'body-mind-spirit',
  'business-economics',
  'comics-graphic-novels',
  'computers',
  'cooking',
  'crafts-hobbies',
  'design',
  'drama',
  'education',
  'family-relationships',
  'fiction',
  'foreign-language-study',
  'games-activities',
  'gardening',
  'health-fitness',
  'history',
  'house-home',
  'humor',
  'juvenile-fiction',
  'juvenile-nonfiction',
  'language-arts-disciplines',
  'law',
  'literary-collections',
  'literary-criticism',
  'mathematics',
  'medical',
  'music',
  'nature',
  'performing-arts',
  'pets',
  'philosophy',
  'photography',
  'poetry',
  'political-science',
  'psychology',
  'reference',
  'religion',
  'science',
  'self-help',
  'social-science',
  'sports-recreation',
  'study-aids',
  'technology-engineering',
  'transportation',
  'travel',
  'true-crime',
  'young-adult-fiction',
  'young-adult-nonfiction',
  'unknown',
]);
export type BookGenre = z.infer<typeof bookGenreSchema>;

/**
 * Metadata fields shared between the transient API cache and a user's permanent library record.
 * Both compose this schema so the two stay in sync.
 */
export const bookMetadataSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  largeThumbnail: z.string().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().optional(),
  publisher: z.string().optional(),
  tags: z.array(z.string()),
  fiction: z.boolean(),
  genre: bookGenreSchema,
  language: z.string().optional(),
});
export type BookMetadata = z.infer<typeof bookMetadataSchema>;

export const bookVolumeSchema = bookMetadataSchema.extend({
  bookRef: bookRefSchema,
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
  log: z.array(logEntrySchema),
});
export type LibraryBookDetail = z.infer<typeof libraryBookDetailSchema>;
