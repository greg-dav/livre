import { type ShelfStatus } from '@livre/types';
import { type ExportBook } from '../lib/goodreadsCsv';

/**
 * A library row normalized out of an import file, provider-agnostic. Metadata fields seed the
 * library_books snapshot (after optional enrichment); `status`, dates, `rating`, and `review` are
 * user-owned facts a format derives from its own columns. Dates are `YYYY-MM-DD`; `addedDate` is
 * always present (formats fall back to today when their source omits it).
 *
 * `isbn` is the canonical identifier used for dedup, persistence, and display. `isbnAlt` is the
 * book's other ISBN when the source carries both (e.g. Goodreads' separate ISBN-10/ISBN-13 cells);
 * it's only used to widen the enrichment lookup — both go into the same batched request so an
 * edition Open Library indexes under one ISBN but not the other still resolves.
 */
export interface ImportRow {
  title: string;
  authors: string[];
  isbn: string | undefined;
  isbnAlt: string | undefined;
  rating: number | undefined;
  review: string | undefined;
  publisher: string | undefined;
  pageCount: number | undefined;
  publishedDate: string | undefined;
  tags: string[];
  status: ShelfStatus;
  addedDate: string;
  dateRead: string | undefined;
}

/**
 * A pluggable import/export adapter for one external library format (Goodreads CSV, …). The
 * transfer service holds a registry of these and exposes them to the client, so adding a format is
 * a matter of implementing this interface and registering it — no route or client change. Mirrors
 * the clients/providers split used for book metadata sources: a format owns the wire shape of its
 * file and nothing else. `capabilities` lets a format support only one direction.
 */
export interface LibraryFormat {
  id: string;
  label: string;
  fileExtension: string;
  mimeType: string;
  capabilities: { import: boolean; export: boolean };
  serialize(books: ExportBook[]): string;
  parse(content: string): ImportRow[];
}
