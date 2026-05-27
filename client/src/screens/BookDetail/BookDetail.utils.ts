import { type LogEventType, type ShelfStatus } from '@livre/types';
import { escapeHtml } from '../../lib/contentEditable';

export const STATUS_LABELS: Record<ShelfStatus, string> = {
  want: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
};

export const SELECTABLE_EVENTS: { event: LogEventType; label: string }[] = [
  { event: 'shelved', label: 'Want to Read' },
  { event: 'started', label: 'Currently Reading' },
  { event: 'finished', label: 'Read' },
  { event: 'dnf', label: 'Did Not Finish' },
];

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

export const formatLanguage = (code: string): string => {
  try {
    return languageNames.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

/*
 * Google returns ISBNs sometimes unformatted ("9781250237231") and sometimes pre-hyphenated.
 * Apply a heuristic grouping for the common English-language pattern: 3-1-3-5-1 for ISBN-13 and
 * 1-3-5-1 for ISBN-10. Exact grouping varies by registration group/publisher prefix — this
 * trades precision for predictability. Pass-through if the input doesn't look like a bare ISBN.
 */
export const formatIsbn = (raw: string): string => {
  const digits = raw.replace(/[^0-9X]/gi, '');
  if (digits.length === 13) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 12)}-${digits.slice(12)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
};

export const formatPublishedDate = (raw: string): string => {
  // Google returns YYYY, YYYY-MM, or YYYY-MM-DD; render the most specific form we can.
  const parts = raw.split('-');
  if (parts.length === 3) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (parts.length === 2) {
    const d = new Date(`${raw}-01`);
    return Number.isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  return raw;
};

/*
 * Google often returns the same author multiple times with slight variations — middle initials
 * present in one entry and absent in another ("Michael D. Matthews" / "Michael Matthews"), or
 * with suffixes added inconsistently ("Robert Caslen" / "Robert L. Caslen Jr."). Normalize by
 * stripping middle initials, suffixes, and punctuation, then keep the first occurrence of each
 * unique key to preserve the publisher's intended ordering.
 */
export const dedupeAuthors = (authors: string[]): string[] => {
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .replace(/\b(jr|sr|iii|ii|iv)\.?\b/g, '')
      .replace(/\b\w\.\s*/g, '')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const seen = new Set<string>();
  return authors.filter((author) => {
    const key = normalize(author);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const formatReadingSince = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Converts a plain-text description (paragraphs separated by \n\n) to <p> HTML for a contenteditable. */
export const toDescriptionHTML = (text: string): string =>
  text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** Reads <p> children from a contenteditable back to \n\n-separated plain text. */
export const readDescriptionContent = (el: HTMLElement): string => {
  const paragraphs = Array.from(el.querySelectorAll('p'));
  if (paragraphs.length === 0) return el.innerText.trim();
  return paragraphs
    .map((p) => p.innerText.trimEnd())
    .filter(Boolean)
    .join('\n\n');
};
