import { z } from 'zod';
import createError from 'http-errors';
import { type BookGenre } from '@livre/types';
import { type SourcedBook } from '../lib/bookRef';

const named = z.object({ name: z.string() });

// Open Library's Books API (jscmd=data) returns a map keyed by the requested bibkey ("ISBN:..."),
// each value a loosely-typed record. Only the fields Livre maps are declared; everything is
// optional because coverage varies wildly across editions, and the looser fields use `.catch` so
// an unexpected shape degrades to "absent" instead of failing the whole batch. Private to this client.
const olEntrySchema = z.object({
  key: z.string().optional(), // edition record key, e.g. "/books/OL7423970M"
  title: z.string().optional(),
  authors: z.array(named).optional(),
  number_of_pages: z.number().optional(),
  publishers: z.array(named).optional(),
  publish_date: z.string().optional(),
  cover: z
    .object({
      small: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional(),
    })
    .optional(),
  subjects: z.array(named).optional().catch(undefined),
  excerpts: z
    .array(z.object({ text: z.string().optional() }))
    .optional()
    .catch(undefined),
  notes: z.string().optional().catch(undefined),
  identifiers: z
    .object({
      openlibrary: z.array(z.string()).optional(),
      isbn_10: z.array(z.string()).optional(),
      isbn_13: z.array(z.string()).optional(),
    })
    .optional()
    .catch(undefined),
});

const olResponseSchema = z.record(z.string(), olEntrySchema);

type OlEntry = z.infer<typeof olEntrySchema>;

// Open Library publish dates are freeform ("September 1998", "1999", "2001-05"). Keep only a
// 4-digit year so the stored value matches the YYYY shape the rest of Livre expects.
const yearOf = (raw: string | undefined): string | undefined => raw?.match(/\d{4}/)?.[0];

const isFiction = (subjects: string[]): boolean => {
  const hay = subjects.join(' | ').toLowerCase();
  if (hay.includes('nonfiction') || hay.includes('non-fiction')) return false;
  return /\b(fiction|novel|novels)\b/.test(hay);
};

// Nonfiction genres keyed by a subject keyword, onto our BISAC-derived enum. Order matters: more
// specific keywords come first so the first hit wins. Only consulted for nonfiction — a fiction book
// must never land on a nonfiction genre (a "psychological fiction" novel isn't "psychology").
const NONFICTION_GENRE_KEYWORDS: [needle: string, genre: BookGenre][] = [
  ['autobiography', 'biography-autobiography'],
  ['biography', 'biography-autobiography'],
  ['computer', 'computers'],
  ['programming', 'computers'],
  ['mathematics', 'mathematics'],
  ['philosophy', 'philosophy'],
  ['history', 'history'],
  ['cooking', 'cooking'],
  ['cookery', 'cooking'],
  ['religion', 'religion'],
  ['business', 'business-economics'],
  ['economic', 'business-economics'],
  ['psychology', 'psychology'],
  ['medical', 'medical'],
  ['medicine', 'medical'],
  ['travel', 'travel'],
  ['music', 'music'],
  ['self-help', 'self-help'],
  ['science', 'science'],
];

const deriveGenre = (subjects: string[], fiction: boolean): BookGenre => {
  const hay = subjects.join(' | ').toLowerCase();
  if (fiction) {
    // Fiction subgenres our enum distinguishes, else the broad fiction root.
    if (hay.includes('poetry')) return 'poetry';
    if (hay.includes('drama') || hay.includes('plays')) return 'drama';
    if (hay.includes('comic') || hay.includes('graphic novel')) return 'comics-graphic-novels';
    if (hay.includes('young adult')) return 'young-adult-fiction';
    if (hay.includes('juvenile')) return 'juvenile-fiction';
    return 'fiction';
  }
  return NONFICTION_GENRE_KEYWORDS.find(([needle]) => hay.includes(needle))?.[1] ?? 'unknown';
};

// The Open Library edition id (e.g. "OL7423970M") — the stable identity we store as externalId.
// An ISBN resolves to one edition and an edition has one OLID, so this is deterministic; the record
// key (always present on a resolved edition) backstops the identifiers list. Never an ISBN.
const olidOf = (entry: OlEntry): string | undefined =>
  entry.identifiers?.openlibrary?.[0] ?? entry.key?.replace(/^\/books\//, '');

const mapEntry = (entry: OlEntry, olid: string): SourcedBook => {
  const subjects = entry.subjects?.map((s) => s.name) ?? [];
  const fiction = isFiction(subjects);
  return {
    source: 'OPEN_LIBRARY',
    externalId: olid,
    title: entry.title ?? '',
    authors: entry.authors?.map((a) => a.name) ?? [],
    publishedDate: yearOf(entry.publish_date),
    publisher: entry.publishers?.[0]?.name,
    pageCount: entry.number_of_pages,
    description: entry.excerpts?.find((e) => e.text)?.text ?? entry.notes,
    thumbnail: entry.cover?.medium ?? entry.cover?.small,
    largeThumbnail: entry.cover?.large ?? entry.cover?.medium,
    isbn: entry.identifiers?.isbn_13?.[0] ?? entry.identifiers?.isbn_10?.[0],
    // Subjects feed the coarse fiction/genre classification below but are not surfaced as tags:
    // OL subjects are a noisy mix of machine markers ("nyt:business-books=..."), marketing
    // ("New York Times bestseller"), and over-granular headings that read as junk on a book.
    tags: [],
    fiction,
    genre: deriveGenre(subjects, fiction),
  };
};

/**
 * HTTP adapter for the Open Library Books API. Used only for enrichment during import — never for
 * interactive search — because it needs no API key and imposes no per-day quota, unlike Google
 * Books. Owns its private wire schema and returns `SourcedBook` whose `externalId` is the edition's
 * stable OLID. `getByIsbns` keys its result Map by the *queried ISBN* (the import lookup key), which
 * is distinct from that identity.
 */
export class OpenLibraryClient {
  // Keep batches well under any practical URL-length limit; a typical import resolves in a handful
  // of requests rather than one per book.
  private static readonly BATCH_SIZE = 100;
  private static readonly USER_AGENT = 'Livre/0.1 (self-hosted reading tracker)';

  /** Resolve many ISBNs in batched requests, keyed by the queried ISBN. */
  async getByIsbns(isbns: string[]): Promise<Map<string, SourcedBook>> {
    const found = new Map<string, SourcedBook>();
    for (let i = 0; i < isbns.length; i += OpenLibraryClient.BATCH_SIZE) {
      const batch = isbns.slice(i, i + OpenLibraryClient.BATCH_SIZE);
      const entries = await this.fetchBibkeys(batch.map((isbn) => `ISBN:${isbn}`));
      for (const isbn of batch) {
        const entry = entries[`ISBN:${isbn}`];
        // Skip editions with no usable title, or with no derivable OLID — both would produce a
        // useless or unresolvable library row. (A resolved edition essentially always has an OLID.)
        const olid = entry && olidOf(entry);
        if (entry?.title && olid) found.set(isbn, mapEntry(entry, olid));
      }
    }
    return found;
  }

  /** Resolve a single book by its Open Library edition id — the identity we persist as externalId. */
  async getByOlid(olid: string): Promise<SourcedBook | null> {
    const entries = await this.fetchBibkeys([`OLID:${olid}`]);
    const entry = entries[`OLID:${olid}`];
    return entry?.title ? mapEntry(entry, olidOf(entry) ?? olid) : null;
  }

  private async fetchBibkeys(bibkeys: string[]): Promise<Record<string, OlEntry>> {
    const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(bibkeys.join(','))}&format=json&jscmd=data`;
    const res = await fetch(url, { headers: { 'User-Agent': OpenLibraryClient.USER_AGENT } });
    if (!res.ok) throw createError(502, 'Open Library API error');
    return olResponseSchema.parse(await res.json());
  }
}
