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

export const updateTagsBodySchema = z.object({ tags: z.array(z.string()) });
export type UpdateTagsBody = z.infer<typeof updateTagsBodySchema>;

export const updateTagsResponseSchema = z.object({ ok: z.literal(true) });

export const updateDescriptionBodySchema = z.object({ description: z.string() });
export type UpdateDescriptionBody = z.infer<typeof updateDescriptionBodySchema>;

export const updateDescriptionResponseSchema = z.object({ ok: z.literal(true) });

export const updateCoverBodySchema = z.object({ url: z.string() });
export type UpdateCoverBody = z.infer<typeof updateCoverBodySchema>;

export const updateCoverResponseSchema = z.object({ ok: z.literal(true) });

export const updateTitleBodySchema = z.object({ title: z.string().min(1) });
export type UpdateTitleBody = z.infer<typeof updateTitleBodySchema>;

export const updateTitleResponseSchema = z.object({ ok: z.literal(true) });

const okResponse = z.object({ ok: z.literal(true) });

export const updatePublisherBodySchema = z.object({ publisher: z.string() });
export type UpdatePublisherBody = z.infer<typeof updatePublisherBodySchema>;
export const updatePublisherResponseSchema = okResponse;

export const updatePageCountBodySchema = z.object({ pageCount: z.number().int().positive() });
export type UpdatePageCountBody = z.infer<typeof updatePageCountBodySchema>;
export const updatePageCountResponseSchema = okResponse;

export const updatePublishedDateBodySchema = z.object({
  publishedDate: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
});
export type UpdatePublishedDateBody = z.infer<typeof updatePublishedDateBodySchema>;
export const updatePublishedDateResponseSchema = okResponse;

export const updateLanguageBodySchema = z.object({
  language: z.string().min(2).max(10),
});
export type UpdateLanguageBody = z.infer<typeof updateLanguageBodySchema>;
export const updateLanguageResponseSchema = okResponse;

export const updateIsbnBodySchema = z.object({ isbn: z.string() });
export type UpdateIsbnBody = z.infer<typeof updateIsbnBodySchema>;
export const updateIsbnResponseSchema = okResponse;

export const refreshMetadataBodySchema = bookMetadataSchema
  .pick({
    title: true,
    authors: true,
    description: true,
    thumbnail: true,
    largeThumbnail: true,
    isbn: true,
    pageCount: true,
    publisher: true,
    publishedDate: true,
    language: true,
  })
  .partial();
export type RefreshMetadataBody = z.infer<typeof refreshMetadataBodySchema>;
export const refreshMetadataResponseSchema = okResponse;

export const updateRatingBodySchema = z.object({
  rating: z.number().min(1).max(5).multipleOf(0.5).nullable(),
});
export type UpdateRatingBody = z.infer<typeof updateRatingBodySchema>;
export const updateRatingResponseSchema = okResponse;

export const updateReviewBodySchema = z.object({ review: z.string() });
export type UpdateReviewBody = z.infer<typeof updateReviewBodySchema>;
export const updateReviewResponseSchema = okResponse;
