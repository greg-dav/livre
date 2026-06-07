import { Text, RatingInput, StarRating } from '@livre/primitives';
import { type ShelfEntry, type LogEntry } from '@livre/types';
import { useReviewEdit } from '../../hooks/useReviewEdit';
import { useNoteComposer } from '../../hooks/useNoteComposer';
import { useLogEntryEdit } from '../../hooks/useLogEntryEdit';
import { LogEntryEditDialog } from '../LogEntryEditDialog/LogEntryEditDialog';
import { LogEntryEditInline } from '../LogEntryEditDialog/LogEntryEditInline';
import { JournalTimeline } from '../../../../components/JournalTimeline/JournalTimeline';
import {
  Panel,
  Head,
  CollapseButton,
  FocusButton,
  RatingRow,
  ReviewSection,
  ReviewHead,
  ExpandInline,
  ReviewBody,
  ReviewEditor,
  ReviewEmpty,
  JournalGrid,
  JournalLeftCol,
  JournalRightCol,
  RightColHead,
  Composer,
  ComposerInputWrap,
  ComposerEditable,
  ComposerBar,
  ComposerButton,
  ComposerSpacer,
} from './Journal.styles';

interface JournalProps {
  entry: ShelfEntry;
  log: LogEntry[];
  justAcquired?: boolean;
  focusMode?: boolean;
  onToggleFocus?: () => void;
  // When the journal is hosted in the mobile sheet dialog: the dialog supplies the heading (so the
  // panel's own head is suppressed), there's no focus mode, and the review edits inline right here
  // (no "expand to write" detour).
  sheet?: boolean;
  onRatingChange?: (rating: number) => void;
  onReviewChange?: (review: string) => void;
  onNoteAdd?: (text: string, type: 'note' | 'quote') => void;
  onLogEntryUpdate?: (logId: number, fields: { text?: string; date?: string }) => void;
  onLogEntryDelete?: (logId: number) => void;
}

/**
 * Right-rail journal for a library book — rating, review, log composer, and chronological
 * timeline of reading activity. In normal mode it's sticky alongside the book content. In focus
 * mode it expands to a full-width two-column layout (left: rating + review; right: composer +
 * timeline), hiding the book section entirely. The composer is a real contenteditable div with
 * Note/Quote mode switching and Cmd+Enter to save. Rating uses half-star precision. The timeline
 * itself is the shared JournalTimeline; entries are clickable to edit when edit callbacks exist.
 */
export const Journal = ({
  entry,
  log,
  justAcquired,
  focusMode,
  onToggleFocus,
  sheet,
  onRatingChange,
  onReviewChange,
  onNoteAdd,
  onLogEntryUpdate,
  onLogEntryDelete,
}: JournalProps) => {
  const rating = entry.rating ?? 0;
  const review = entry.review;

  const reviewEdit = useReviewEdit(review ?? undefined, onReviewChange);
  const noteComposer = useNoteComposer();
  const logEntryEdit = useLogEntryEdit(
    (logId, fields) => onLogEntryUpdate?.(logId, fields),
    (logId) => onLogEntryDelete?.(logId)
  );

  const editable = !!(onLogEntryUpdate && onLogEntryDelete);

  const ratingRow = (
    <RatingRow $focusMode={focusMode}>
      <Text variant="label" color="muted">
        Rating
      </Text>
      {onRatingChange ? (
        <RatingInput value={rating} onChange={onRatingChange} />
      ) : (
        <StarRating value={rating} />
      )}
    </RatingRow>
  );

  const reviewSection = (
    <ReviewSection $focusMode={focusMode}>
      <ReviewHead>
        <Text variant="label" color="muted">
          Review
        </Text>
        {!focusMode && !sheet && (
          <ExpandInline type="button" onClick={onToggleFocus}>
            <Text variant="label" color="accent">
              Expand to write →
            </Text>
          </ExpandInline>
        )}
      </ReviewHead>
      {focusMode || sheet ? (
        <Text variant="body1" as="div">
          <ReviewEditor
            ref={reviewEdit.editorRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={reviewEdit.handleFocus}
            onInput={reviewEdit.handleInput}
            onBlur={reviewEdit.handleBlur}
            onKeyDown={reviewEdit.handleKeyDown}
          />
        </Text>
      ) : review ? (
        <ReviewBody>
          <Text variant="body2">{review}</Text>
        </ReviewBody>
      ) : (
        <ReviewEmpty>
          <Text variant="body2" color="muted">
            No review yet.
          </Text>
        </ReviewEmpty>
      )}
    </ReviewSection>
  );

  // "Retrospective" only fits books you've actually closed out; reading and want-to-read get the
  // neutral, forward-looking prompt instead.
  const composerPlaceholder =
    entry.status === 'read' || entry.status === 'dnf'
      ? 'Leave a retrospective note…'
      : 'Capture a thought…';

  const composer = (
    <Composer>
      <ComposerInputWrap
        $focusMode={focusMode}
        onClick={() => noteComposer.inputRef.current?.focus()}
      >
        <Text variant="body2" as="div">
          <ComposerEditable
            ref={noteComposer.inputRef}
            contentEditable
            suppressContentEditableWarning
            onInput={noteComposer.handleInput}
            onKeyDown={(e) =>
              noteComposer.handleKeyDown(e, (text, type) => onNoteAdd?.(text, type))
            }
            data-placeholder={composerPlaceholder}
          />
        </Text>
      </ComposerInputWrap>
      <ComposerBar>
        <ComposerButton
          type="button"
          $active={noteComposer.type === 'note'}
          onClick={() => noteComposer.setType('note')}
        >
          <Text variant="label">Note</Text>
        </ComposerButton>
        <ComposerButton
          type="button"
          $active={noteComposer.type === 'quote'}
          onClick={() => noteComposer.setType('quote')}
        >
          <Text variant="label">Quote</Text>
        </ComposerButton>
        <ComposerSpacer />
        <ComposerButton
          type="button"
          $primary
          disabled={noteComposer.isEmpty}
          onClick={() => noteComposer.handleSave((text, type) => onNoteAdd?.(text, type))}
        >
          <Text variant="label">Save</Text>
        </ComposerButton>
      </ComposerBar>
    </Composer>
  );

  const timeline = (
    <JournalTimeline
      log={log}
      hasActiveReading={entry.status === 'reading'}
      onEntryClick={editable ? logEntryEdit.openEdit : undefined}
    />
  );

  // In the mobile sheet, editing an entry happens inline (swapping the composer + timeline for the
  // editor) so we never stack a second sheet over the journal sheet. Everywhere else it's a dialog.
  const sheetEditing = sheet && logEntryEdit.editingEntry !== null;

  return (
    <Panel $justAcquired={justAcquired} $focusMode={focusMode}>
      {!sheet && (
        <Head>
          <Text variant={focusMode ? 'h3' : 'h4'} as="h2">
            Journal
          </Text>
          {focusMode ? (
            <CollapseButton type="button" onClick={onToggleFocus}>
              <Text variant="label">↙ Collapse</Text>
            </CollapseButton>
          ) : (
            <FocusButton type="button" onClick={onToggleFocus}>
              <Text variant="label">⤢ Focus</Text>
            </FocusButton>
          )}
        </Head>
      )}

      {focusMode ? (
        <JournalGrid>
          <JournalLeftCol>
            {ratingRow}
            {reviewSection}
          </JournalLeftCol>
          <JournalRightCol>
            <RightColHead>
              <Text variant="label" color="muted">
                Log
              </Text>
            </RightColHead>
            {composer}
            {timeline}
          </JournalRightCol>
        </JournalGrid>
      ) : (
        <>
          {ratingRow}
          {reviewSection}
          {sheetEditing ? (
            <LogEntryEditInline {...logEntryEdit} />
          ) : (
            <>
              {composer}
              {timeline}
            </>
          )}
        </>
      )}

      {!sheet && <LogEntryEditDialog {...logEntryEdit} />}
    </Panel>
  );
};
