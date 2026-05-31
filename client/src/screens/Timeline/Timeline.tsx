import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Loader, Text } from '@livre/primitives';
import { type TimelineBook } from '@livre/types';
import { Layout } from '../../components';
import { SIDEBAR_PANEL_WIDTH } from '../../lib/layout';
import { useTimeline } from './useTimeline';
import { Gantt } from './Gantt';
import { LogDialog } from './LogDialog';
import {
  getViewRange,
  getApiRange,
  buildScaleModel,
  startOfToday,
  cycleBarGeometry,
  RIGHT_GUTTER,
  type Horizon,
} from './timelineScale';
import {
  Screen,
  Controls,
  ControlsSpacer,
  SegGroup,
  SegButton,
  StatChips,
  StatChip,
  StatDivider,
  CenterState,
} from './Timeline.styles';

const HORIZONS: { value: Horizon; label: string }[] = [
  { value: '1m', label: '1 mo' },
  { value: '3m', label: '3 mo' },
  { value: '6m', label: '6 mo' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1 yr' },
  { value: 'all', label: 'All' },
];

const HORIZON_STORAGE_KEY = 'livre.timeline.horizon';
const VALID_HORIZONS = new Set(HORIZONS.map((h) => h.value));

const loadHorizon = (): Horizon => {
  const stored = localStorage.getItem(HORIZON_STORAGE_KEY);
  return stored && VALID_HORIZONS.has(stored as Horizon) ? (stored as Horizon) : 'ytd';
};

const Stat = ({ value, label }: { value: number; label: string }) => (
  <StatChip>
    <Text variant="h6" as="span">
      {value}
    </Text>
    <Text variant="label" color="muted">
      {label}
    </Text>
  </StatChip>
);

/**
 * Reading timeline screen. A horizontal gantt of every book's reading cycles (one bar per read).
 * Horizon tabs and stat chips reflect the books currently in view; clicking any book opens its full
 * log in a dialog. All axis math runs through a shared d3 time scale — see timelineScale.ts.
 */
export const Timeline = () => {
  const [horizon, setHorizonState] = useState<Horizon>(loadHorizon);
  const setHorizon = (h: Horizon) => {
    setHorizonState(h);
    localStorage.setItem(HORIZON_STORAGE_KEY, h);
  };
  const [selected, setSelected] = useState<{ book: TimelineBook; focusEventId?: number } | null>(
    null
  );

  const today = useMemo(() => startOfToday(), []);
  // The date range is filtered server-side so large libraries don't ship every book. 'All' sends no
  // range (server returns everything); the earliest cycle is then derived client-side for the scale.
  const apiRange = useMemo(() => getApiRange(horizon, today), [horizon, today]);
  const { data, isLoading } = useTimeline(apiRange);
  const books = useMemo(() => data ?? [], [data]);

  const screenRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  useLayoutEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => setTimelineWidth(Math.max(0, el.clientWidth - SIDEBAR_PANEL_WIDTH));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => {
    const { start, end } = getViewRange(horizon, books, today);
    // Stretch the scale to fill the available width minus the trailing gutter, so short horizons
    // are full-bleed while leaving room for the today-line pins.
    return buildScaleModel(start, end, Math.max(0, timelineWidth - RIGHT_GUTTER));
  }, [horizon, books, today, timelineWidth]);

  const visibleBooks = useMemo(
    () => books.filter((b) => b.cycles.some((c) => cycleBarGeometry(c.start, c.end, model))),
    [books, model]
  );

  const stats = useMemo(() => {
    const reading = visibleBooks.filter((b) => b.cycles.some((c) => c.status === 'reading')).length;
    const finished = visibleBooks.filter(
      (b) =>
        !b.cycles.some((c) => c.status === 'reading') && b.cycles.some((c) => c.status === 'read')
    ).length;
    const notes = visibleBooks
      .flatMap((b) => b.cycles)
      .flatMap((c) => c.events)
      .filter((e) => e.event === 'note' || e.event === 'quote').length;
    return { finished, reading, notes };
  }, [visibleBooks]);

  return (
    <Layout fullWidth title="Reading Timeline">
      <Screen ref={screenRef}>
        <Controls>
          <SegGroup>
            {HORIZONS.map((h) => (
              <SegButton
                key={h.value}
                $active={horizon === h.value}
                onClick={() => setHorizon(h.value)}
              >
                <Text variant="label">{h.label}</Text>
              </SegButton>
            ))}
          </SegGroup>
          <ControlsSpacer />
          <StatChips>
            <Stat value={stats.finished} label="Finished" />
            <StatDivider />
            <Stat value={stats.reading} label="Reading" />
            <StatDivider />
            <Stat value={stats.notes} label="Notes & quotes" />
          </StatChips>
        </Controls>

        {isLoading ? (
          <CenterState>
            <Loader />
          </CenterState>
        ) : visibleBooks.length === 0 ? (
          <CenterState>
            <Text variant="body1" color="muted">
              No reading activity in this range yet.
            </Text>
          </CenterState>
        ) : (
          <Gantt
            books={visibleBooks}
            model={model}
            onSelect={(book, focusEventId) => setSelected({ book, focusEventId })}
          />
        )}
      </Screen>
      <LogDialog
        book={selected?.book ?? null}
        focusEventId={selected?.focusEventId}
        onClose={() => setSelected(null)}
      />
    </Layout>
  );
};
