import { Text, Button, Dialog } from '@livre/primitives';
import type { BookVolume } from '@livre/types';
import { ResultCard, ResultCover, ResultMeta, ResultActions } from './IsbnLookupResult.styles';

interface IsbnLookupResultProps {
  book: BookVolume;
  onSaveIsbnOnly: () => void;
  onSaveWithMetadata: () => void;
}

/**
 * Shown in the ISBN dialog when a lookup finds a matching book. Displays a compact card with
 * the cover, title, authors, and key metadata fields, then offers two actions: update all
 * metadata or save the ISBN alone.
 */
export const IsbnLookupResult = ({
  book,
  onSaveIsbnOnly,
  onSaveWithMetadata,
}: IsbnLookupResultProps) => {
  const byline = [
    book.publishedDate?.slice(0, 4),
    book.publisher,
    book.pageCount ? `${book.pageCount} pp` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <ResultCard>
        {book.thumbnail && <ResultCover src={book.thumbnail} alt={book.title} />}
        <ResultMeta>
          <Text variant="ui-md">{book.title}</Text>
          {book.authors.length > 0 && (
            <Text variant="ui-sm" color="muted">
              {book.authors.join(', ')}
            </Text>
          )}
          {byline && (
            <Text variant="ui-xs" color="muted">
              {byline}
            </Text>
          )}
        </ResultMeta>
      </ResultCard>

      <ResultActions>
        <Dialog.Close asChild>
          <Button variant="ghost" size="sm" type="button">
            <Text variant="label">Cancel</Text>
          </Button>
        </Dialog.Close>
        <Button variant="ghost" size="sm" type="button" onClick={onSaveIsbnOnly}>
          <Text variant="label">Save ISBN only</Text>
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={onSaveWithMetadata}>
          <Text variant="label" color="onColor">
            Update metadata
          </Text>
        </Button>
      </ResultActions>
    </>
  );
};
