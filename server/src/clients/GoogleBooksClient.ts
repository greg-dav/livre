import { z } from 'zod';
import createError from 'http-errors';
import { type BookSearchResponse } from '@livre/types';

const googleVolumeSchema = z.object({
  id: z.string(),
  volumeInfo: z.object({
    title: z.string(),
    authors: z.array(z.string()).optional(),
    publishedDate: z.string().optional(),
    description: z.string().optional(),
    publisher: z.string().optional(),
    pageCount: z.number().optional(),
    categories: z.array(z.string()).optional(),
    language: z.string().optional(),
    imageLinks: z
      .object({
        thumbnail: z.string().optional(),
        smallThumbnail: z.string().optional(),
      })
      .optional(),
    industryIdentifiers: z.array(z.object({ type: z.string(), identifier: z.string() })).optional(),
  }),
});

const googleBooksResponseSchema = z.object({
  totalItems: z.number(),
  items: z.array(googleVolumeSchema).optional(),
});

export class GoogleBooksClient {
  async validateApiKey(key: string): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1&key=${key}`
    );
    if (!res.ok) throw createError(400, 'Invalid Google Books API key');
  }

  async search(query: string, apiKey: string): Promise<BookSearchResponse> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw createError(502, 'Google Books API error');

    const { totalItems, items = [] } = googleBooksResponseSchema.parse(await res.json());

    const results = items.map((v) => {
      const isbn =
        v.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ??
        v.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier;

      // Google returns http thumbnails — upgrade to https
      const thumbnail = v.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://');

      return {
        googleId: v.id,
        title: v.volumeInfo.title,
        authors: v.volumeInfo.authors ?? [],
        publishedDate: v.volumeInfo.publishedDate,
        description: v.volumeInfo.description,
        publisher: v.volumeInfo.publisher,
        pageCount: v.volumeInfo.pageCount,
        categories: v.volumeInfo.categories ?? [],
        language: v.volumeInfo.language,
        thumbnail,
        isbn,
      };
    });

    return { results, total: totalItems };
  }
}
