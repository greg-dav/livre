import { z } from 'zod';
import { parse as parseCsv } from 'csv-parse/sync';
import { type ShelfStatus } from '@livre/types';
import { toGoodreadsCsv, type ExportBook } from '../lib/goodreadsCsv';
import { normalizeIsbn } from '../lib/isbn';
import { type ImportRow, type LibraryFormat } from './LibraryFormat';

// csv-parse with `columns: true` yields one header-keyed record of string cells per row.
const csvRecordsSchema = z.array(z.record(z.string(), z.string()));

// Goodreads' four reserved exclusive-shelf names map onto Livre statuses. Anything else a book is
// shelved under is a user's custom shelf and becomes a Livre tag.
const EXCLUSIVE_SHELF_TO_STATUS: Record<string, ShelfStatus> = {
  'to-read': 'want',
  'currently-reading': 'reading',
  read: 'read',
  'did-not-finish': 'dnf',
};
const RESERVED_SHELVES = new Set(Object.keys(EXCLUSIVE_SHELF_TO_STATUS));

// Goodreads dates are YYYY/MM/DD; normalize to the YYYY-MM-DD Livre stores. Anything unparseable
// (including the common empty cell) yields null.
const parseDate = (raw: string | undefined): string | null => {
  const m = (raw ?? '').trim().match(/^(\d{4})[/-](\d{2})[/-](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

const parseRating = (raw: string | undefined): number | null => {
  const n = Number.parseInt((raw ?? '').trim(), 10);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};

const parseInteger = (raw: string | undefined): number | null => {
  const n = Number.parseInt((raw ?? '').trim(), 10);
  return Number.isFinite(n) ? n : null;
};

const nonEmpty = (raw: string | undefined): string | null => {
  const t = (raw ?? '').trim();
  return t.length > 0 ? t : null;
};

// "Author" is the primary; "Additional Authors" is a comma-separated list. Blanks are dropped.
const parseAuthors = (primary: string | undefined, additional: string | undefined): string[] =>
  [primary ?? '', ...(additional ?? '').split(',')]
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

// Custom shelves only — strip the four reserved exclusive-shelf names, which Goodreads also lists
// under Bookshelves for non-read books.
const parseTags = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !RESERVED_SHELVES.has(s));

const today = (): string => new Date().toISOString().slice(0, 10);

const rowFrom = (record: Record<string, string>): ImportRow => {
  const status = EXCLUSIVE_SHELF_TO_STATUS[(record['Exclusive Shelf'] ?? '').trim()] ?? 'want';
  // Goodreads guards ISBNs against spreadsheet reinterpretation as ="0853459916" (empty = "").
  // normalizeIsbn unwraps that. Prefer the 13-digit column as canonical; keep the 10-digit one as
  // the alternate (when both are present) so enrichment can try both.
  const isbn13 = normalizeIsbn(record['ISBN13']);
  const isbn10 = normalizeIsbn(record['ISBN']);
  const isbn = isbn13 ?? isbn10;
  return {
    title: (record['Title'] ?? '').trim(),
    authors: parseAuthors(record['Author'], record['Additional Authors']),
    isbn,
    isbnAlt: isbn13 && isbn10 ? isbn10 : null,
    rating: parseRating(record['My Rating']),
    review: nonEmpty(record['My Review']),
    publisher: nonEmpty(record['Publisher']),
    pageCount: parseInteger(record['Number of Pages']),
    publishedDate: (record['Year Published'] ?? '').trim().match(/\d{4}/)?.[0] ?? null,
    tags: parseTags(record['Bookshelves']),
    status,
    addedDate: parseDate(record['Date Added']) ?? today(),
    dateRead: parseDate(record['Date Read']),
  };
};

/**
 * Goodreads CSV adapter. Export reuses the hand-rolled `toGoodreadsCsv` serializer; import leans on
 * csv-parse because Goodreads reviews routinely contain embedded commas, doubled quotes, and
 * newlines that a hand-rolled parser would mangle. The `columns: true` option keys each row by
 * header, and `relax_column_count` tolerates the 3rd-party "Average Rating" variant.
 */
export const GoodreadsFormat: LibraryFormat = {
  id: 'goodreads',
  label: 'Goodreads',
  fileExtension: 'csv',
  mimeType: 'text/csv',
  capabilities: { import: true, export: true },

  serialize(books: ExportBook[]): string {
    return toGoodreadsCsv(books);
  },

  parse(content: string): ImportRow[] {
    const records = csvRecordsSchema.parse(
      parseCsv(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
        trim: false,
      })
    );
    return records.map(rowFrom);
  },
};
