import { useNavigate } from 'react-router-dom';
import { BareDialog, Button, StarRating, Text } from '@livre/primitives';
import { type TimelineBook, type LogEntry } from '@livre/types';
import { JournalTimeline } from '../../components/JournalTimeline/JournalTimeline';
import {
  DialogHead,
  DialogCover,
  DialogHeadMeta,
  DialogRating,
  DialogBody,
} from './Timeline.styles';

interface LogDialogProps {
  book: TimelineBook | null;
  focusEventId?: number;
  onClose: () => void;
}

const byDateDesc = (a: LogEntry, b: LogEntry): number => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.id - a.id;
};

/**
 * Read-only expansion of a single book's reading log, opened from the timeline. The header pairs the
 * cover with title/author/rating and a "View book" action; the log itself is the shared
 * JournalTimeline (so pins read identically to the book-detail journal) and scrolls within the
 * dialog. Editing lives on the book page. When opened from an event dot, that entry is highlighted
 * and scrolled into view. The visible title is custom, so the primitive's own title is hidden.
 */
export const LogDialog = ({ book, focusEventId, onClose }: LogDialogProps) => {
  const navigate = useNavigate();
  if (!book) return null;

  const events: LogEntry[] = book.cycles.flatMap((c) => c.events);
  if (book.shelvedDate) {
    events.push({ id: -1, event: 'shelved', date: book.shelvedDate });
  }
  events.sort(byDateDesc);

  const hasActiveReading = book.cycles.some((c) => c.status === 'reading');

  return (
    <BareDialog open onOpenChange={(open) => !open && onClose()} title={book.title}>
      <DialogHead>
        <DialogCover
          style={book.coverUrl ? { backgroundImage: `url(${book.coverUrl})` } : undefined}
        />
        <DialogHeadMeta>
          <Text variant="h4" as="h2">
            {book.title}
          </Text>
          <Text variant="ui-sm" color="muted">
            {book.authors.join(', ')}
          </Text>
          {book.rating != null && (
            <DialogRating>
              <StarRating value={book.rating} />
            </DialogRating>
          )}
        </DialogHeadMeta>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            navigate(`/library/${book.libraryBookId}`, { state: { backLabel: 'Log' } })
          }
        >
          <Text variant="label" color="default">
            View book →
          </Text>
        </Button>
      </DialogHead>

      <DialogBody>
        <JournalTimeline
          log={events}
          hasActiveReading={hasActiveReading}
          focusEntryId={focusEventId}
          flush
        />
      </DialogBody>
    </BareDialog>
  );
};
