import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Text } from '@livre/primitives';
import { type TimelineBook, type TimelineCycle, type LogEntry } from '@livre/types';
import { parseDateLocal } from '../../lib/dateInput';
import { type ScaleModel, cycleBarGeometry, RIGHT_GUTTER } from './timelineScale';
import {
  GanttScroll,
  GanttGrid,
  Corner,
  BookListCol,
  BookRowLabel,
  BrlCover,
  BrlInfo,
  BrlText,
  BrlStatus,
  TimelineHeader,
  MonthRow,
  MonthCell,
  HeaderGridLine,
  GanttRows,
  GanttRow,
  GridLine,
  TodayLabel,
  GanttBar,
  BarInnerLabel,
  BarEventDot,
  HoverCard,
} from './Timeline.styles';

interface GanttProps {
  books: TimelineBook[];
  model: ScaleModel;
  onSelect: (book: TimelineBook, focusEventId?: number) => void;
}

type CycleStatus = TimelineCycle['status'];

interface HoverState {
  x: number;
  y: number;
  title?: string;
  detail: string;
}

const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const fmtDuration = (days: number): string =>
  days <= 1
    ? '1 day'
    : days < 7
      ? `${days} days`
      : days < 32
        ? `${Math.round(days / 7)} wk`
        : `${Math.round(days / 30.5)} mo`;

const bookStatus = (book: TimelineBook): CycleStatus => {
  if (book.cycles.some((c) => c.status === 'reading')) return 'reading';
  return book.cycles[book.cycles.length - 1]?.status ?? 'read';
};

/**
 * Two-column reading gantt rendered in a single scroll container: a `sticky left` book column and a
 * `sticky top` header, so native scrolling keeps every region aligned with zero JS sync. Each book
 * renders one bar per reading cycle, positioned by the shared d3 time scale. A cursor-following card
 * surfaces one-line detail on hover; clicking a bar opens the book's log, clicking an event dot
 * opens it focused on that event. Auto-scrolls to "now" on mount and scale changes.
 */
export const Gantt = ({ books, model, onSelect }: GanttProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Land the view on "now": whenever the scale changes (horizon switch, data load, resize), snap
  // the scroll fully right so the most recent activity and the today line are visible by default.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [model.totalWidth]);

  const showHover = (e: MouseEvent, content: { title?: string; detail: string }) =>
    setHover({ x: e.clientX, y: e.clientY, ...content });
  const clearHover = () => setHover(null);

  const timelineWidth = model.totalWidth + RIGHT_GUTTER;

  return (
    <GanttScroll ref={scrollRef}>
      <GanttGrid $timelineWidth={timelineWidth}>
        <Corner>
          <Text variant="label" color="muted">
            Book
          </Text>
        </Corner>

        <TimelineHeader>
          <MonthRow>
            {model.monthCells.map((cell, i) => {
              // Suppress a month label that would collide with the Today pin — happens when a month
              // boundary lands within today's column (e.g. viewing on the 1st), stacking "Jun" behind
              // "Today". The pin sits at the column's trailing edge, so allow a day-column of slack.
              const collidesWithToday =
                model.todayX !== null && cell.left > model.todayX - model.dayPx - 30;
              return (
                <MonthCell key={i} $left={cell.left} $width={cell.width}>
                  {cell.width >= 34 && !collidesWithToday && (
                    <Text variant="label" color="muted">
                      {cell.label}
                    </Text>
                  )}
                </MonthCell>
              );
            })}
            {model.monthLines.map((left, i) => (
              <HeaderGridLine key={`hl${i}`} $left={left} />
            ))}
            {model.todayX !== null && (
              <TodayLabel $left={model.todayX}>
                <Text variant="label" color="accent">
                  Today
                </Text>
              </TodayLabel>
            )}
          </MonthRow>
        </TimelineHeader>

        <BookListCol>
          {books.map((book) => {
            const status = bookStatus(book);
            return (
              <BookRowLabel
                key={book.libraryBookId}
                $activeReading={status === 'reading'}
                onClick={() => onSelect(book)}
              >
                <BrlCover
                  style={book.coverUrl ? { backgroundImage: `url(${book.coverUrl})` } : undefined}
                />
                <BrlInfo>
                  <BrlText>
                    <Text variant="h6" as="div">
                      {book.title}
                    </Text>
                  </BrlText>
                  <BrlText>
                    <Text variant="ui-xs" color="muted">
                      {book.authors.join(', ')}
                    </Text>
                  </BrlText>
                </BrlInfo>
                <BrlStatus $status={status} />
              </BookRowLabel>
            );
          })}
        </BookListCol>

        <GanttRows>
          {model.monthLines.map((left, i) => (
            <GridLine key={`m${i}`} $variant="month" $left={left} />
          ))}
          {model.weekLines.map((left, i) => (
            <GridLine key={`w${i}`} $variant="week" $left={left} />
          ))}
          {model.todayX !== null && <GridLine $variant="today" $left={model.todayX} />}

          {books.map((book) => (
            <GanttRow key={book.libraryBookId}>
              {book.cycles.map((cycle, ci) => {
                const geom = cycleBarGeometry(cycle.start, cycle.end, model);
                if (!geom) return null;
                const startD = parseDateLocal(cycle.start);
                const endD = cycle.end ? parseDateLocal(cycle.end) : model.viewEnd;
                const days = Math.max(
                  1,
                  Math.round((endD.getTime() - startD.getTime()) / 86_400_000) + 1
                );
                const ratingText =
                  cycle.status === 'read' && book.rating
                    ? ` · ${'★'.repeat(Math.round(book.rating))}`
                    : '';
                const barDetail = `${fmtShort(startD)} → ${cycle.end ? fmtShort(endD) : 'present'} · ${fmtDuration(days)}${ratingText}`;

                return (
                  <GanttBar
                    key={ci}
                    $left={geom.left}
                    $width={geom.width}
                    $status={cycle.status}
                    onClick={() => onSelect(book)}
                    onMouseEnter={(e) => showHover(e, { title: book.title, detail: barDetail })}
                    onMouseMove={(e) => showHover(e, { title: book.title, detail: barDetail })}
                    onMouseLeave={clearHover}
                  >
                    {geom.width > 60 && (
                      <BarInnerLabel>
                        <Text variant="h6" as="span">
                          {book.title}
                        </Text>
                      </BarInnerLabel>
                    )}
                    {cycle.events
                      .filter(
                        (ev): ev is LogEntry & { event: 'note' | 'quote' } =>
                          ev.event === 'note' || ev.event === 'quote'
                      )
                      .map((ev) => {
                        const ed = parseDateLocal(ev.date);
                        if (ed < model.viewStart || ed > model.viewEnd) return null;
                        const dotLeft = model.x(ed) - geom.left;
                        const variant = ev.event === 'quote' ? 'quote' : 'note';
                        const dotDetail = `${variant === 'quote' ? 'Quote' : 'Note'} · ${fmtShort(ed)}`;
                        return (
                          <BarEventDot
                            key={ev.id}
                            $variant={variant}
                            $left={dotLeft}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(book, ev.id);
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              showHover(e, { detail: dotDetail });
                            }}
                            onMouseMove={(e) => {
                              e.stopPropagation();
                              showHover(e, { detail: dotDetail });
                            }}
                          />
                        );
                      })}
                  </GanttBar>
                );
              })}
            </GanttRow>
          ))}
        </GanttRows>
      </GanttGrid>

      {hover && (
        <HoverCard $x={hover.x} $y={hover.y}>
          {hover.title && (
            <Text variant="ui-sm" as="div">
              {hover.title}
            </Text>
          )}
          <Text variant="ui-xs" color="muted" as="div">
            {hover.detail}
          </Text>
        </HoverCard>
      )}
    </GanttScroll>
  );
};
