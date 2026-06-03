// Unit separator — won't appear in a title or author name, so it can't blur the title/author
// boundary when the two are concatenated into one key.
const SEP = '\x1f';

const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * A fuzzy identity key for a book, used as the import dedup fallback when no ISBN is available
 * (manual entries, or Goodreads rows with a blank ISBN). Built from the normalized title and
 * author list so the same book re-imported matches itself. Deliberately conservative — it only
 * collapses case and whitespace — so distinct editions/translations (which differ by author list,
 * e.g. a translator) stay separate rather than being wrongly skipped.
 */
export const titleAuthorKey = (title: string, authors: string[]): string =>
  `${normalize(title)}${SEP}${authors.map(normalize).filter(Boolean).join('|')}`;
