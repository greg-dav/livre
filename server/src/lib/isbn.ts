/**
 * Canonical form of an ISBN for cross-provider equality: keep only ISBN characters and uppercase
 * the check digit. ISBN is the one identifier shared across sources, so it's the robust key for
 * import dedup — an existing book might be GOOGLE_BOOKS while its imported twin is OPEN_LIBRARY.
 * Returns null when nothing usable remains.
 */
export const normalizeIsbn = (raw: string | null | undefined): string | null => {
  const cleaned = (raw ?? '').replace(/[^0-9Xx]/g, '').toUpperCase();
  return cleaned.length > 0 ? cleaned : null;
};
