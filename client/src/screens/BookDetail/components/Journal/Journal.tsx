import { Fragment } from 'react';
import { Text, RatingInput, StarRating } from '@livre/primitives';
import { type ShelfEntry, type LogEntry, type BookFormat } from '@livre/types';
import { FORMAT_ICONS } from '../FormatIcons';
import { useReviewEdit } from '../../hooks/useReviewEdit';
import { useNoteComposer } from '../../hooks/useNoteComposer';
import { useLogEntryEdit } from '../../hooks/useLogEntryEdit';
import { parseDateLocal } from '../../../../lib/dateInput';
import { LogEntryEditDialog } from '../LogEntryEditDialog/LogEntryEditDialog';
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
  Timeline,
  TimelineEntry,
  LandmarkHead,
  NoteMeta,
  QuoteBlock,
  CycleMethod,
  CycleDivider,
} from './Journal.styles';

interface JournalProps {
  entry: ShelfEntry;
  log: LogEntry[];
  justAcquired?: boolean;
  focusMode?: boolean;
  onToggleFocus?: () => void;
  onRatingChange?: (rating: number) => void;
  onReviewChange?: (review: string) => void;
  onNoteAdd?: (text: string, type: 'note' | 'quote') => void;
  onLogEntryUpdate?: (logId: number, fields: { text?: string; date?: string }) => void;
  onLogEntryDelete?: (logId: number) => void;
}

const STATUS_VERBS: Record<string, string> = {
  shelved: 'Shelved',
  started: 'Started',
  restarted: 'Restarted',
  finished: 'Finished',
  dnf: 'Did not finish',
};

const formatLogDate = (iso: string): string => {
  const d = parseDateLocal(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
};

const FORMAT_LABELS: Record<string, string> = {
  physical: 'Physical',
  ereader: 'E-reader',
  audio: 'Audio',
};

/**
 * Right-rail journal for a library book — rating, review, log composer, and chronological
 * timeline of reading activity. In normal mode it's sticky alongside the book content. In focus
 * mode it expands to a full-width two-column layout (left: rating + review; right: composer +
 * timeline), hiding the book section entirely. The composer is a real contenteditable div with
 * Note/Quote mode switching and Cmd+Enter to save. Rating uses half-star precision.
 * Timeline entries are clickable to edit or delete when edit callbacks are provided.
 */
export const Journal = ({
  entry,
  log,
  justAcquired,
  focusMode,
  onToggleFocus,
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

  const headStartIndex =
    entry.status === 'reading'
      ? log.findIndex((e) => e.event === 'started' || e.event === 'restarted')
      : -1;
  const headEvent = headStartIndex >= 0 ? log[headStartIndex] : null;
  const restEntries = log.filter((_, i) => i !== headStartIndex);
  const totalEntries = (headEvent ? 1 : 0) + restEntries.length;

  // Index in restEntries where the previous cycle begins — the first landmark event
  // (started/restarted/finished/dnf) encountered in descending order. Only relevant when
  // there's an active reading head; without one, all entries are already past cycles.
  const cycleBreakIndex = headEvent
    ? restEntries.findIndex(
        (e) =>
          e.event === 'started' ||
          e.event === 'restarted' ||
          e.event === 'finished' ||
          e.event === 'dnf'
      )
    : -1;

  // Walk ascending to assign a format to each cycle's terminal landmark.
  // Reset on finished/dnf (after consuming), not on started/restarted — format events
  // are often logged before the started event and still belong to that cycle.
  const formatByLandmarkId = new Map<number, BookFormat>();
  let cycleFormat: BookFormat | null = null;
  for (const e of [...log].reverse()) {
    if (e.event === 'format') {
      cycleFormat = e.format;
    } else if (e.event === 'finished' || e.event === 'dnf') {
      if (cycleFormat) formatByLandmarkId.set(e.id, cycleFormat);
      cycleFormat = null; // consumed; start fresh for the next (earlier) cycle
    }
  }
  // After the loop, cycleFormat holds whatever format was set for the open (active) cycle.
  const headFormat = headEvent ? cycleFormat : null;

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
        {!focusMode && (
          <ExpandInline type="button" onClick={onToggleFocus}>
            <Text variant="label" color="accent">
              Expand to write →
            </Text>
          </ExpandInline>
        )}
      </ReviewHead>
      {focusMode ? (
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

  const CYCLE_ICON_SIZES: Record<string, [number, number]> = {
    physical: [10, 8],
    ereader: [7, 9],
    audio: [10, 8],
  };

  const renderCycleMethod = (format: BookFormat) => {
    const Icon = FORMAT_ICONS[format];
    const [w, h] = CYCLE_ICON_SIZES[format] ?? [10, 8];
    return (
      <CycleMethod>
        {Icon && <Icon width={w} height={h} />}
        <Text variant="ui-xs" color="muted">
          {FORMAT_LABELS[format]}
        </Text>
      </CycleMethod>
    );
  };

  const composerPlaceholder =
    entry.status === 'reading' ? 'Capture a thought…' : 'Leave a retrospective note…';

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

  const clickProps = (logEntry: LogEntry) =>
    editable ? { $clickable: true, onClick: () => logEntryEdit.openEdit(logEntry) } : {};

  const timeline = totalEntries > 0 && (
    <Timeline
      $single={(headEvent ? 1 : 0) + restEntries.filter((e) => e.event !== 'format').length === 1}
    >
      {headEvent && (
        <TimelineEntry $landmark $open {...clickProps(headEvent)}>
          <LandmarkHead>
            <Text variant="label" color="accent">
              Reading
            </Text>
            <Text variant="ui-tight">since {formatLogDate(headEvent.date)}</Text>
          </LandmarkHead>
          {headFormat && renderCycleMethod(headFormat)}
        </TimelineEntry>
      )}
      {restEntries.map((logEntry, idx) => {
        const divider =
          idx === cycleBreakIndex ? (
            <CycleDivider>
              <Text variant="tiny" color="muted">
                Previous cycle
              </Text>
            </CycleDivider>
          ) : null;

        if (logEntry.event === 'note') {
          return (
            <Fragment key={logEntry.id}>
              {divider}
              <TimelineEntry {...clickProps(logEntry)}>
                <NoteMeta>
                  <Text variant="ui-xs" color="muted">
                    Note · {formatLogDate(logEntry.date)}
                  </Text>
                </NoteMeta>
                <Text variant="body2">{logEntry.text}</Text>
              </TimelineEntry>
            </Fragment>
          );
        }
        if (logEntry.event === 'quote') {
          return (
            <Fragment key={logEntry.id}>
              {divider}
              <TimelineEntry {...clickProps(logEntry)}>
                <NoteMeta>
                  <Text variant="ui-xs" color="muted">
                    Quote · {formatLogDate(logEntry.date)}
                  </Text>
                </NoteMeta>
                <QuoteBlock>
                  <Text variant="quote">{logEntry.text}</Text>
                </QuoteBlock>
              </TimelineEntry>
            </Fragment>
          );
        }
        if (logEntry.event === 'format') {
          return null; // absorbed into the cycle's terminal landmark
        }
        const cycleMethodFormat = formatByLandmarkId.get(logEntry.id);
        return (
          <Fragment key={logEntry.id}>
            {divider}
            <TimelineEntry $landmark {...clickProps(logEntry)}>
              <LandmarkHead>
                <Text variant="label" color="accent">
                  {STATUS_VERBS[logEntry.event] ?? logEntry.event}
                </Text>
                <Text variant="ui-tight">{formatLogDate(logEntry.date)}</Text>
              </LandmarkHead>
              {cycleMethodFormat && renderCycleMethod(cycleMethodFormat)}
            </TimelineEntry>
          </Fragment>
        );
      })}
      <LogEntryEditDialog {...logEntryEdit} />
    </Timeline>
  );

  return (
    <Panel $justAcquired={justAcquired} $focusMode={focusMode}>
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
          {composer}
          {timeline}
        </>
      )}
    </Panel>
  );
};
