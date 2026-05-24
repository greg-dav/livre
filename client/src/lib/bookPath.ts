import type { ShelfEntry } from '@livre/types';

export const bookPath = (googleId: string, library: ShelfEntry[] | undefined): string => {
  const entry = library?.find((e) => e.googleId === googleId);
  return entry ? `/library/${entry.userBookId}` : `/search/book/${googleId}`;
};
