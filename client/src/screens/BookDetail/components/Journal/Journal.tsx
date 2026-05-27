import { Text, StarRating } from '@livre/primitives';
import { type ShelfEntry, type LogEntry, type LogEventType } from '@livre/types';
import {
  Panel,
  Head,
  FocusButton,
  RatingRow,
  ReviewSection,
  ReviewHead,
  ExpandInline,
  ReviewBody,
  ReviewEmpty,
  Composer,
  ComposerInput,
  ComposerBar,
  ComposerButton,
  ComposerSpacer,
  Timeline,
  TimelineEntry,
  LandmarkHead,
  NoteMeta,
} from './Journal.styles';

interface JournalProps {
  entry: ShelfEntry;
  log: LogEntry[];
  justAcquired?: boolean;
}

const STATUS_VERBS: Record<Exclude<LogEventType, 'note'>, string> = {
  shelved: 'Shelved',
  started: 'Started',
  restarted: 'Restarted',
  finished: 'Finished',
  dnf: 'Did not finish',
};

/*
 * "Sept 14" for current-year dates; "Mar 12, 2024" for older ones. Matches the prototype's
 * timeline date treatment — keeps recent activity terse and reaches for the year only when
 * disambiguation is needed.
 */
const formatLogDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
};

/**
 * Right-rail journal for a library book — rating, review, log composer, and chronological
 * timeline of reading activity. Sticky-positioned alongside the book content. The timeline
 * iterates over the reading log: status events render as accent landmarks; notes render as
 * plain dots with body text. When the book is currently being read, the head started/restarted
 * event is promoted to a "Reading since X" open-ring banner at the top of the rail.
 *
 * Scaffolded interactions (Focus expansion, composer save, +Event picker) are visual stubs
 * pending follow-up wiring.
 */
export const Journal = ({ entry, log, justAcquired }: JournalProps) => {
  const rating = entry.rating ?? 0;
  const review = entry.review;

  // The most recent started/restarted event is the head of the current cycle. When status is
  // 'reading', that event is rendered separately as the "Reading since X" banner and skipped in
  // the chronological list below — matching the prototype's banner-then-activity ordering.
  const headStartIndex =
    entry.status === 'reading'
      ? log.findIndex((e) => e.event === 'started' || e.event === 'restarted')
      : -1;
  const headEvent = headStartIndex >= 0 ? log[headStartIndex] : null;
  const restEntries = log.filter((_, i) => i !== headStartIndex);
  const totalEntries = (headEvent ? 1 : 0) + restEntries.length;

  return (
    <Panel $justAcquired={justAcquired}>
      <Head>
        <Text variant="h4" as="h2">
          Journal
        </Text>
        <FocusButton type="button">
          <Text variant="label">⤢ Focus</Text>
        </FocusButton>
      </Head>

      <RatingRow>
        <Text variant="label" color="muted">
          Rating
        </Text>
        <StarRating value={rating} />
      </RatingRow>

      <ReviewSection>
        <ReviewHead>
          <Text variant="label" color="muted">
            Review
          </Text>
          <ExpandInline type="button">
            <Text variant="label" color="accent">
              Expand to write →
            </Text>
          </ExpandInline>
        </ReviewHead>
        {review ? (
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

      <Composer>
        <ComposerInput>
          <Text variant="body2" color="muted">
            Capture a thought…
          </Text>
        </ComposerInput>
        <ComposerBar>
          <ComposerButton type="button" $active>
            <Text variant="label">Note</Text>
          </ComposerButton>
          <ComposerButton type="button">
            <Text variant="label">Quote</Text>
          </ComposerButton>
          <ComposerButton type="button">
            <Text variant="label">+ Event ▾</Text>
          </ComposerButton>
          <ComposerSpacer />
          <ComposerButton type="button" $primary>
            <Text variant="label">Save</Text>
          </ComposerButton>
        </ComposerBar>
      </Composer>

      {totalEntries > 0 && (
        <Timeline>
          {headEvent && (
            <TimelineEntry $landmark $open>
              <LandmarkHead>
                <Text variant="label" color="accent">
                  Reading
                </Text>
                <Text variant="ui-tight">since {formatLogDate(headEvent.date)}</Text>
              </LandmarkHead>
            </TimelineEntry>
          )}
          {restEntries.map((logEntry) =>
            logEntry.event === 'note' ? (
              <TimelineEntry key={logEntry.id}>
                <NoteMeta>
                  <Text variant="label" color="muted">
                    Note · {formatLogDate(logEntry.date)}
                  </Text>
                </NoteMeta>
                {logEntry.note && <Text variant="body2">{logEntry.note}</Text>}
              </TimelineEntry>
            ) : (
              <TimelineEntry key={logEntry.id} $landmark>
                <LandmarkHead>
                  <Text variant="label" color="accent">
                    {STATUS_VERBS[logEntry.event]}
                  </Text>
                  <Text variant="ui-tight">{formatLogDate(logEntry.date)}</Text>
                </LandmarkHead>
              </TimelineEntry>
            )
          )}
        </Timeline>
      )}
    </Panel>
  );
};
