import uniqBy from 'lodash/uniqBy';
import {
  type SearchScope,
  type SearchSort,
  type ShelfFilter,
  type ShelfStatus,
} from '@livre/types';

/**
 * Display labels for the search vocabulary. State across the SearchProvider, the Search and Author
 * screens, and the shared SortMenu is held as the provider-agnostic wire types directly
 * (SearchScope etc.), so values pass straight to the API with no translation; these maps only
 * supply the human-facing text. Iteration uses each schema's `.options` at the call site.
 */

export const SCOPE_LABELS: Record<SearchScope, string> = {
  anything: 'Anything',
  title: 'Title',
  author: 'Author',
  subject: 'Subject',
  isbn: 'ISBN',
};

export const SHELF_LABELS: Record<ShelfFilter, string> = {
  in: 'In my library',
  out: 'Not yet added',
};

export const SORT_LABELS: Record<SearchSort, string> = {
  relevance: 'Relevance',
  newest: 'Newest',
};

export const STATUS_LABELS: Record<ShelfStatus, string> = {
  want: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
};

/**
 * Drop repeats by bookRef while preserving order. The source occasionally returns the same volume
 * on more than one paginated page, which would otherwise collide on the `key` and double a card.
 */
export const dedupeByRef = <T extends { bookRef: string }>(items: T[]): T[] =>
  uniqBy(items, 'bookRef');
