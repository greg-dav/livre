import { Fragment, useLayoutEffect, useRef } from 'react';
import { Text, Icon, type IconName } from '@livre/primitives';
import { type LogEntry, type BookFormat } from '@livre/types';
import { parseDateLocal } from '../../lib/dateInput';
import {
  Timeline,
  TimelineEntry,
  LandmarkHead,
  NoteMeta,
  QuoteBlock,
  CycleMethod,
  CycleDivider,
} from './JournalTimeline.styles';

interface JournalTimelineProps {
  log: LogEntry[];
  /** Whether the book currently has an open reading session — surfaces the "Reading since…" head. */
  hasActiveReading: boolean;
  /** When provided, entries become clickable (e.g. to edit). Omit for a read-only timeline. */
  onEntryClick?: (entry: LogEntry) => void;
  /** Highlights the matching entry and scrolls it into view — e.g. the event clicked on the gantt. */
  focusEntryId?: number;
  /** Drops the timeline's top margin so it sits flush under a custom header (e.g. the log dialog). */
  flush?: boolean;
}

const STATUS_VERBS: Record<string, string> = {
  shelved: 'Shelved',
  started: 'Started',
  restarted: 'Restarted',
  finished: 'Finished',
  dnf: 'Did not finish',
};

const FORMAT_LABELS: Record<BookFormat, string> = {
  physical: 'Physical',
  ereader: 'E-reader',
  audio: 'Audio',
};

const FORMAT_ICONS: Record<BookFormat, IconName> = {
  physical: 'book',
  ereader: 'tablet',
  audio: 'headphones',
};

const formatLogDate = (iso: string): string => {
  const d = parseDateLocal(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
};

const renderCycleMethod = (format: BookFormat) => (
  <CycleMethod>
    <Icon icon={FORMAT_ICONS[format]} size={12} />
    <Text variant="ui-xs" color="muted">
      {FORMAT_LABELS[format]}
    </Text>
  </CycleMethod>
);

/**
 * Reverse-chronological timeline of a book's reading log — landmarks (started/finished/dnf), notes,
 * and quotes rendered as pins on a vertical rail. Groups events into reading cycles, absorbing each
 * cycle's `format` event into a method label on its terminal landmark, and shows a divider before a
 * previous cycle when there's an active read. Purely presentational: it owns no editing state —
 * pass `onEntryClick` to make entries actionable. Shared by the book-detail journal and the reading
 * timeline's expanded dialog so pin styling stays single-sourced.
 */
export const JournalTimeline = ({
  log,
  hasActiveReading,
  onEntryClick,
  focusEntryId,
  flush,
}: JournalTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (focusEntryId == null) return;
    containerRef.current
      ?.querySelector('[data-focused="true"]')
      ?.scrollIntoView({ block: 'center' });
  }, [focusEntryId]);

  const headStartIndex = hasActiveReading
    ? log.findIndex((e) => e.event === 'started' || e.event === 'restarted')
    : -1;
  const headEvent = headStartIndex >= 0 ? log[headStartIndex] : null;
  const restEntries = log.filter((_, i) => i !== headStartIndex);
  const totalEntries = (headEvent ? 1 : 0) + restEntries.length;

  // First landmark (descending) after the active head — marks where the previous cycle begins.
  const cycleBreakIndex = headEvent
    ? restEntries.findIndex(
        (e) =>
          e.event === 'started' ||
          e.event === 'restarted' ||
          e.event === 'finished' ||
          e.event === 'dnf'
      )
    : -1;

  // Walk ascending to assign each cycle's format to its terminal landmark. Reset on finished/dnf
  // (after consuming), not on started — format events are often logged before the started event.
  const formatByLandmarkId = new Map<number, BookFormat>();
  let cycleFormat: BookFormat | null = null;
  for (const e of [...log].reverse()) {
    if (e.event === 'format') {
      cycleFormat = e.format;
    } else if (e.event === 'finished' || e.event === 'dnf') {
      if (cycleFormat) formatByLandmarkId.set(e.id, cycleFormat);
      cycleFormat = null;
    }
  }
  const headFormat = headEvent ? cycleFormat : null;

  if (totalEntries === 0) return null;

  const clickProps = (entry: LogEntry) => {
    const focused = focusEntryId != null && entry.id === focusEntryId;
    return {
      ...(onEntryClick ? { $clickable: true, onClick: () => onEntryClick(entry) } : {}),
      ...(focused ? { $focused: true, 'data-focused': true } : {}),
    };
  };

  const isSingle =
    (headEvent ? 1 : 0) + restEntries.filter((e) => e.event !== 'format').length === 1;

  return (
    <Timeline ref={containerRef} $single={isSingle} $flush={flush}>
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
      {restEntries.map((entry, idx) => {
        const divider =
          idx === cycleBreakIndex ? (
            <CycleDivider>
              <Text variant="tiny" color="muted">
                Previous cycle
              </Text>
            </CycleDivider>
          ) : null;

        if (entry.event === 'note') {
          return (
            <Fragment key={entry.id}>
              {divider}
              <TimelineEntry {...clickProps(entry)}>
                <NoteMeta>
                  <Text variant="ui-xs" color="muted">
                    Note · {formatLogDate(entry.date)}
                  </Text>
                </NoteMeta>
                <Text variant="body2">{entry.text}</Text>
              </TimelineEntry>
            </Fragment>
          );
        }
        if (entry.event === 'quote') {
          return (
            <Fragment key={entry.id}>
              {divider}
              <TimelineEntry {...clickProps(entry)}>
                <NoteMeta>
                  <Text variant="ui-xs" color="muted">
                    Quote · {formatLogDate(entry.date)}
                  </Text>
                </NoteMeta>
                <QuoteBlock>
                  <Text variant="quote">{entry.text}</Text>
                </QuoteBlock>
              </TimelineEntry>
            </Fragment>
          );
        }
        if (entry.event === 'format') return null;

        const landmarkFormat = formatByLandmarkId.get(entry.id);
        return (
          <Fragment key={entry.id}>
            {divider}
            <TimelineEntry $landmark {...clickProps(entry)}>
              <LandmarkHead>
                <Text variant="label" color="accent">
                  {STATUS_VERBS[entry.event] ?? entry.event}
                </Text>
                <Text variant="ui-tight">{formatLogDate(entry.date)}</Text>
              </LandmarkHead>
              {landmarkFormat && renderCycleMethod(landmarkFormat)}
            </TimelineEntry>
          </Fragment>
        );
      })}
    </Timeline>
  );
};

export type { JournalTimelineProps };
