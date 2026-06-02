import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Icon, Loader, Popover, Text } from '@livre/primitives';
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
import { Screen, FilterDock, ChipHead, HorizonTick, Main, CenterState } from './Timeline.styles';

const HORIZONS: { value: Horizon; label: string }[] = [
  { value: '1m', label: 'Last month' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

const HORIZON_STORAGE_KEY = 'livre.timeline.horizon';
const VALID_HORIZONS = new Set(HORIZONS.map((h) => h.value));

const loadHorizon = (): Horizon => {
  const stored = localStorage.getItem(HORIZON_STORAGE_KEY);
  return stored && VALID_HORIZONS.has(stored as Horizon) ? (stored as Horizon) : 'ytd';
};

/**
 * Reading timeline screen. A horizontal gantt of every book's reading cycles (one bar per read)
 * fills the screen; a floating chip in the bottom-right corner shows the active period and opens a
 * Popover period picker on click. Clicking any book opens its full log in a dialog. All axis math
 * runs through a shared d3 time scale — see timelineScale.ts.
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
  const [filterOpen, setFilterOpen] = useState(false);

  const today = useMemo(() => startOfToday(), []);
  // The date range is filtered server-side so large libraries don't ship every book. 'All' sends no
  // range (server returns everything); the earliest cycle is then derived client-side for the scale.
  const apiRange = useMemo(() => getApiRange(horizon, today), [horizon, today]);
  const { data, isLoading } = useTimeline(apiRange);
  const books = useMemo(() => data ?? [], [data]);

  const mainRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  useLayoutEffect(() => {
    const el = mainRef.current;
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

  const activeLabel = HORIZONS.find((h) => h.value === horizon)?.label ?? '';

  return (
    <Layout fullWidth title="Reading Timeline">
      <Screen>
        <Main ref={mainRef}>
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
        </Main>

        <FilterDock>
          <Popover
            open={filterOpen}
            onOpenChange={setFilterOpen}
            trigger={
              <ChipHead aria-label="Filter by period">
                <Icon icon="config" size={15} />
                <Text variant="ui-sm">{activeLabel}</Text>
              </ChipHead>
            }
          >
            <Popover.Panel>
              {HORIZONS.map((h) => {
                const active = horizon === h.value;
                return (
                  <Popover.Item key={h.value} active={active} onSelect={() => setHorizon(h.value)}>
                    <HorizonTick $active={active}>
                      {active && <Icon icon="check" size={10} />}
                    </HorizonTick>
                    <Text className="menu-label" variant="ui-tight">
                      {h.label}
                    </Text>
                  </Popover.Item>
                );
              })}
            </Popover.Panel>
          </Popover>
        </FilterDock>
      </Screen>
      <LogDialog
        book={selected?.book ?? null}
        focusEventId={selected?.focusEventId}
        onClose={() => setSelected(null)}
      />
    </Layout>
  );
};
