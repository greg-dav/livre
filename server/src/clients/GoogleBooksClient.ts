import _ from 'lodash';
import { z } from 'zod';
import createError from 'http-errors';
import { type BookGenre, type SearchScope, type SearchSort } from '@livre/types';
import { type SourcedBook, type SourcedBookSearchResponse } from '../lib/bookRef';

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

// undici (Node's global fetch) has no default request timeout, so a stalled socket would hang the
// caller forever — fatal for the sequential import loop, which awaits one request per row.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * A request Google rejected for exceeding the per-user rate limit (HTTP 429). Distinct from a served
 * error because Google does NOT charge a 429 against the daily quota — callers must neither count it
 * nor treat it as a hard failure (the row is deferrable and a re-run will retry it).
 */
export class RateLimitError extends Error {
  constructor() {
    super('Google Books rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

async function timedFetch(url: string): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (res.status === 429) throw new RateLimitError();
  return res;
}

const BISAC_ROOT_TO_GENRE: Record<string, BookGenre> = {
  'ANTIQUES & COLLECTIBLES': 'antiques-collectibles',
  ARCHITECTURE: 'architecture',
  ART: 'art',
  BIBLES: 'bibles',
  'BIOGRAPHY & AUTOBIOGRAPHY': 'biography-autobiography',
  'BODY, MIND & SPIRIT': 'body-mind-spirit',
  'BUSINESS & ECONOMICS': 'business-economics',
  'COMICS & GRAPHIC NOVELS': 'comics-graphic-novels',
  COMPUTERS: 'computers',
  COOKING: 'cooking',
  'CRAFTS & HOBBIES': 'crafts-hobbies',
  DESIGN: 'design',
  DRAMA: 'drama',
  EDUCATION: 'education',
  'FAMILY & RELATIONSHIPS': 'family-relationships',
  FICTION: 'fiction',
  'FOREIGN LANGUAGE STUDY': 'foreign-language-study',
  'GAMES & ACTIVITIES': 'games-activities',
  GARDENING: 'gardening',
  'HEALTH & FITNESS': 'health-fitness',
  HISTORY: 'history',
  'HOUSE & HOME': 'house-home',
  HUMOR: 'humor',
  'JUVENILE FICTION': 'juvenile-fiction',
  'JUVENILE NONFICTION': 'juvenile-nonfiction',
  'LANGUAGE ARTS & DISCIPLINES': 'language-arts-disciplines',
  LAW: 'law',
  'LITERARY COLLECTIONS': 'literary-collections',
  'LITERARY CRITICISM': 'literary-criticism',
  MATHEMATICS: 'mathematics',
  MEDICAL: 'medical',
  MUSIC: 'music',
  NATURE: 'nature',
  'PERFORMING ARTS': 'performing-arts',
  PETS: 'pets',
  PHILOSOPHY: 'philosophy',
  PHOTOGRAPHY: 'photography',
  POETRY: 'poetry',
  'POLITICAL SCIENCE': 'political-science',
  PSYCHOLOGY: 'psychology',
  REFERENCE: 'reference',
  RELIGION: 'religion',
  SCIENCE: 'science',
  'SELF-HELP': 'self-help',
  'SOCIAL SCIENCE': 'social-science',
  'SPORTS & RECREATION': 'sports-recreation',
  'STUDY AIDS': 'study-aids',
  'TECHNOLOGY & ENGINEERING': 'technology-engineering',
  TRANSPORTATION: 'transportation',
  TRAVEL: 'travel',
  'TRUE CRIME': 'true-crime',
  'YOUNG ADULT FICTION': 'young-adult-fiction',
  'YOUNG ADULT NONFICTION': 'young-adult-nonfiction',
};

function extractGenre(raw: string[]): BookGenre {
  if (raw.length === 0) return 'unknown';
  const root = raw[0].split(' / ')[0].trim().toUpperCase();
  return BISAC_ROOT_TO_GENRE[root] ?? 'unknown';
}

function extractFiction(raw: string[]): boolean {
  return raw.some((cat) => {
    const root = cat.split(' / ')[0].toLowerCase();
    return root === 'fiction' || root === 'juvenile fiction' || root === 'young adult fiction';
  });
}

// BISAC subject strings are slash-separated paths ("Fiction / Science Fiction / Alien Contact").
// Trim each to its most specific meaningful segment: drop a trailing "General" leaf (it adds no
// information) and then take the last segment. Deduplicate the resulting strings.
function normalizeCategories(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const category of raw) {
    const segments = category.split(' / ');
    const last = segments[segments.length - 1];
    const leaf =
      last.toLowerCase() === 'general' && segments.length > 1
        ? segments[segments.length - 2]
        : last;
    if (!seen.has(leaf)) {
      seen.add(leaf);
      result.push(leaf);
    }
  }
  return result;
}

// Google Books descriptions are HTML snippets. Convert block-level tags to newlines,
// strip remaining markup, and decode common entities so callers get plain text.
function cleanDescription(html: string): string {
  return html
    .replace(/<\/?(p|br|div|h[1-6])\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Google's cover URLs accept a `zoom` parameter; `zoom=0` asks for the best available size
// and falls back gracefully when a larger one doesn't exist. `edge=curl` adds a cosmetic
// page-curl we don't want. Munging lets a search result expose a high-quality cover without
// the extra per-book volume fetch that would otherwise be required to read `imageLinks.large`.
function upgradeCoverUrl(url: string): string {
  return url.replace(/([?&])zoom=\d+/, '$1zoom=0').replace(/&edge=curl/g, '');
}

// Translate a provider-agnostic search scope into the Google Books field qualifiers. This is the
// only place that knows the wire syntax, so the client stays the sole owner of Google specifics.
function scopedQuery(query: string, scope: SearchScope): string {
  const q = query.trim();
  switch (scope) {
    case 'title':
      return `intitle:${q}`;
    case 'author':
      return `inauthor:${q}`;
    case 'subject':
      return `subject:${q}`;
    case 'isbn':
      return `isbn:${q.replace(/[^0-9Xx]/g, '')}`;
    default:
      return q;
  }
}

function mapVolume(v: GoogleVolume): SourcedBook {
  const isbn =
    v.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ??
    v.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier;

  const imgs = v.volumeInfo.imageLinks;
  const toHttps = (url: string) => url.replace('http://', 'https://');

  const pickUrl = (keys: (keyof NonNullable<typeof imgs>)[]) =>
    _.chain(keys)
      .map((k) => imgs?.[k])
      .compact()
      .map(toHttps)
      .first()
      .value() as string | undefined;

  const rawThumbnail = pickUrl(['thumbnail', 'smallThumbnail']);
  const thumbnail = rawThumbnail ? upgradeCoverUrl(rawThumbnail) : undefined;
  const largeThumbnail =
    pickUrl(['extraLarge', 'large', 'medium', 'small']) ??
    (thumbnail ? upgradeCoverUrl(thumbnail) : undefined);

  return {
    source: 'GOOGLE_BOOKS',
    externalId: v.id,
    title: v.volumeInfo.title,
    authors: v.volumeInfo.authors ?? [],
    publishedDate: v.volumeInfo.publishedDate,
    description: v.volumeInfo.description ? cleanDescription(v.volumeInfo.description) : undefined,
    publisher: v.volumeInfo.publisher,
    pageCount: v.volumeInfo.pageCount,
    tags: normalizeCategories(v.volumeInfo.categories ?? []),
    fiction: extractFiction(v.volumeInfo.categories ?? []),
    genre: extractGenre(v.volumeInfo.categories ?? []),
    language: v.volumeInfo.language,
    thumbnail,
    largeThumbnail,
    isbn,
  };
}

export class GoogleBooksClient {
  static async validateApiKey(key: string): Promise<void> {
    const res = await timedFetch(
      `https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1&key=${key}`
    );
    if (!res.ok) throw createError(400, 'Invalid Google Books API key');
  }

  constructor(private readonly apiKey: string) {}

  // `newest` maps onto Google's own ordering so paging stays globally sorted; `relevance` is the
  // default. There is no native "oldest", which is why the sort enum omits it.
  async search(
    query: string,
    scope: SearchScope = 'anything',
    opts: { startIndex?: number; sort?: SearchSort; maxResults?: number } = {}
  ): Promise<SourcedBookSearchResponse> {
    const orderBy = opts.sort === 'newest' ? 'newest' : 'relevance';
    const startIndex = opts.startIndex ?? 0;
    // 40 is the Google Books ceiling for a single page.
    const maxResults = Math.min(opts.maxResults ?? 40, 40);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(scopedQuery(query, scope))}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=${orderBy}&key=${this.apiKey}`;
    const res = await timedFetch(url);
    if (!res.ok) throw createError(502, 'Google Books API error');

    const { totalItems, items = [] } = googleBooksResponseSchema.parse(await res.json());
    return { results: items.map(mapVolume), total: totalItems };
  }

  async searchByAuthor(
    name: string,
    opts: { startIndex?: number; sort?: SearchSort } = {}
  ): Promise<SourcedBookSearchResponse> {
    return this.search(`inauthor:"${name}"`, 'anything', opts);
  }

  async getById(id: string): Promise<SourcedBook> {
    const url = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${this.apiKey}`;
    const res = await timedFetch(url);
    if (res.status === 404) throw createError(404, 'Book not found');
    if (!res.ok) throw createError(502, 'Google Books API error');
    return mapVolume(googleVolumeSchema.parse(await res.json()));
  }
}
