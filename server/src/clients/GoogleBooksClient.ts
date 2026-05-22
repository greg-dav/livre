import { z } from 'zod';
import createError from 'http-errors';
import { type BookSearchResult, type BookSearchResponse } from '@livre/types';

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
        smallThumbnail: z.string().optional(),
        thumbnail: z.string().optional(),
        small: z.string().optional(),
        medium: z.string().optional(),
        large: z.string().optional(),
        extraLarge: z.string().optional(),
      })
      .optional(),
    industryIdentifiers: z.array(z.object({ type: z.string(), identifier: z.string() })).optional(),
  }),
});

const googleBooksResponseSchema = z.object({
  totalItems: z.number(),
  items: z.array(googleVolumeSchema).optional(),
});

type GoogleVolume = z.infer<typeof googleVolumeSchema>;

function mapVolume(v: GoogleVolume): BookSearchResult {
  const isbn =
    v.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ??
    v.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier;

  const imgs = v.volumeInfo.imageLinks;
  // Google returns http image URLs — upgrade to https
  const toHttps = (url: string) => url.replace('http://', 'https://');
  // The zoom param in the thumbnail URL controls resolution (1=128px, 3=575px, 5=1280px).
  // Larger imageLinks keys are absent on search results, so we derive sizes from zoom instead.
  const setZoom = (url: string, zoom: number) => url.replace(/([?&]zoom=)\d+/, `$1${zoom}`);
  const rawThumb = imgs?.thumbnail ?? imgs?.smallThumbnail;
  const thumbnail = rawThumb ? toHttps(setZoom(rawThumb, 1)) : undefined;
  const largeThumbnail = rawThumb
    ? toHttps(
        imgs?.extraLarge ?? imgs?.large ?? imgs?.medium ?? imgs?.small ?? setZoom(rawThumb, 3)
      )
    : undefined;

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
    largeThumbnail,
    isbn,
  };
}

export class GoogleBooksClient {
  static async validateApiKey(key: string): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1&key=${key}`
    );
    if (!res.ok) throw createError(400, 'Invalid Google Books API key');
  }

  constructor(private readonly apiKey: string) {}

  async search(query: string): Promise<BookSearchResponse> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw createError(502, 'Google Books API error');

    const { totalItems, items = [] } = googleBooksResponseSchema.parse(await res.json());
    return { results: items.map(mapVolume), total: totalItems };
  }

  async getById(id: string): Promise<BookSearchResult> {
    const url = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${this.apiKey}`;
    const res = await fetch(url);
    if (res.status === 404) throw createError(404, 'Book not found');
    if (!res.ok) throw createError(502, 'Google Books API error');
    return mapVolume(googleVolumeSchema.parse(await res.json()));
  }
}
