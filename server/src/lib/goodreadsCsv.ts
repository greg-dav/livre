import { type ShelfStatus } from '@livre/types';

/**
 * One library book flattened for CSV export. Reading-log facts (date read, read count) are
 * pre-aggregated by the repository so this module stays pure string formatting.
 */
export interface ExportBook {
  id: number;
  title: string;
  authors: string[];
  isbn: string | null;
  rating: number | null;
  publisher: string | null;
  pageCount: number | null;
  publishedDate: string | null;
  addedDate: string;
  tags: string[];
  review: string | null;
  status: ShelfStatus;
  dateRead: string | null;
  readCount: number;
}

// The canonical Goodreads library export header, in order. Columns Livre has no equivalent for are
// still emitted (blank) so the file imports cleanly into anything that expects the Goodreads shape.
const COLUMNS = [
  'Book Id',
  'Title',
  'Author',
  'Author l-f',
  'Additional Authors',
  'ISBN',
  'ISBN13',
  'My Rating',
  'Publisher',
  'Binding',
  'Number of Pages',
  'Year Published',
  'Original Publication Year',
  'Date Read',
  'Date Added',
  'Bookshelves',
  'Bookshelves with positions',
  'Exclusive Shelf',
  'My Review',
  'Spoiler',
  'Private Notes',
  'Read Count',
  'Owned Copies',
] as const;

// Livre statuses map onto Goodreads' three exclusive shelves; 'dnf' has no Goodreads equivalent so
// it gets a custom shelf name that survives a round-trip without colliding with the reserved three.
const EXCLUSIVE_SHELF: Record<ShelfStatus, string> = {
  want: 'to-read',
  reading: 'currently-reading',
  read: 'read',
  dnf: 'did-not-finish',
};

// Goodreads writes ISBNs as ="..." so spreadsheet apps don't reinterpret them as numbers and strip
// leading zeros. An empty value is written as ="".
const isbnCell = (isbn: string | null): string => `="${isbn ?? ''}"`;

// Livre stores a single ISBN; route it into the ISBN-10 or ISBN-13 column by digit length so the
// pair matches Goodreads' two-column layout, leaving the other column blank.
const isbnCells = (isbn: string | null): [isbn10: string, isbn13: string] => {
  const digits = isbn?.replace(/[^0-9Xx]/g, '') ?? '';
  return digits.length === 13 ? [isbnCell(null), isbnCell(isbn)] : [isbnCell(isbn), isbnCell(null)];
};

// Goodreads only stores whole-star ratings; Livre allows half-stars, so round to the nearest whole
// star for a clean re-import. 0 means unrated.
const ratingCell = (rating: number | null): string =>
  rating == null ? '0' : String(Math.round(rating));

// The shelves a book is listed under: its exclusive shelf (Goodreads omits 'read' here, matching its
// own export) followed by the user's custom shelves (Livre tags).
const shelvesFor = (book: ExportBook): string[] => [
  ...(book.status === 'read' ? [] : [EXCLUSIVE_SHELF[book.status]]),
  ...book.tags,
];

// "First Last" → "Last, First". Single-token names are returned unchanged.
const toLastFirst = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`;
};

const yearOf = (date: string | null): string => date?.match(/^\d{4}/)?.[0] ?? '';

// Date columns are emitted as YYYY/MM/DD to match Goodreads; addedDate may carry a time component.
const toDateCell = (date: string | null): string => {
  if (!date) return '';
  const day = date.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day.replace(/-/g, '/') : '';
};

const escapeCell = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const rowFor = (book: ExportBook): string[] => {
  const [first, ...rest] = book.authors;
  const [isbn10, isbn13] = isbnCells(book.isbn);
  const shelves = shelvesFor(book);
  return [
    String(book.id),
    book.title,
    first ?? '',
    first ? toLastFirst(first) : '',
    rest.join(', '),
    isbn10,
    isbn13,
    ratingCell(book.rating),
    book.publisher ?? '',
    '',
    book.pageCount == null ? '' : String(book.pageCount),
    yearOf(book.publishedDate),
    '',
    toDateCell(book.dateRead),
    toDateCell(book.addedDate),
    shelves.join(', '),
    shelves.map((shelf, i) => `${shelf} (#${i + 1})`).join(', '),
    EXCLUSIVE_SHELF[book.status],
    book.review ?? '',
    '',
    '',
    String(book.readCount),
    '0',
  ];
};

/** Serialise a user's library into a Goodreads-shaped CSV string (CRLF line endings, header first). */
export const toGoodreadsCsv = (books: ExportBook[]): string => {
  const lines = [COLUMNS.join(','), ...books.map((b) => rowFor(b).map(escapeCell).join(','))];
  return lines.join('\r\n') + '\r\n';
};
