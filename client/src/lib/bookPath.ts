import type { ShelfEntry } from '@livre/types';

/**
 * Resolve the route for a book: library detail if the user already owns it, otherwise the
 * discovery view for that opaque ref. The client never inspects bookRef contents.
 */
export const bookPath = (bookRef: string, library: ShelfEntry[] | undefined): string => {
  const entry = library?.find((e) => e.bookRef === bookRef);
  return entry ? `/library/${entry.libraryBookId}` : `/search/book/${encodeURIComponent(bookRef)}`;
};
