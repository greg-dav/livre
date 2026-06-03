import { Buffer } from 'node:buffer';
import {
  bookSourceSchema,
  type BookMetadata,
  type BookSource,
  type BookVolume,
} from '@livre/types';

// ASCII unit separator — guaranteed not to appear in a BookSource enum value or in any
// upstream provider's external ID format.
const SEP = '\x1f';

/**
 * Server-internal representation of a book sourced from an external provider. Carries the
 * `source` and `externalId` fields needed to round-trip cache lookups and persist library
 * records. Converted to the client-facing `BookVolume` (with opaque `bookRef`) at the API
 * boundary by `toBookVolume`.
 */
export type SourcedBook = BookMetadata & {
  source: BookSource;
  externalId: string;
};

export type SourcedBookSearchResponse = {
  results: SourcedBook[];
  total: number;
  // Offset for the next page, or null when this was the last. A source that drops unmappable hits
  // sets this explicitly so the cursor tracks the page stride rather than the (smaller) result count;
  // when absent, the faceted layer derives it from the result count (valid when nothing is dropped).
  nextStartIndex?: number | null;
};

export const encodeBookRef = (source: BookSource, externalId: string): string =>
  Buffer.from(`${source}${SEP}${externalId}`, 'utf8').toString('base64url');

export const decodeBookRef = (ref: string): { source: BookSource; externalId: string } => {
  const raw = Buffer.from(ref, 'base64url').toString('utf8');
  const idx = raw.indexOf(SEP);
  if (idx === -1) throw new Error('Invalid bookRef');
  return {
    source: bookSourceSchema.parse(raw.slice(0, idx)),
    externalId: raw.slice(idx + 1),
  };
};

export const toBookVolume = (book: SourcedBook): BookVolume => {
  const { source, externalId, ...metadata } = book;
  return { ...metadata, bookRef: encodeBookRef(source, externalId) };
};
