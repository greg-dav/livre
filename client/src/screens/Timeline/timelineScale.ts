import { scaleTime, type ScaleTime } from 'd3-scale';
import { timeMonth, timeMonday, timeDay } from 'd3-time';
import { type TimelineBook } from '@livre/types';
import { parseDateLocal } from '../../lib/dateInput';

export type Horizon = '1m' | '3m' | '6m' | 'ytd' | '1y' | 'all';

export const DAY_PX = 5.2;
// Minimum rendered bar length. Reads still scale per-horizon (a long read is wider at 1 mo than at
// 1 yr), but no bar drops below this so short reads stay legible and clickable at every zoom.
export const MIN_BAR_PX = 28;
// Trailing room past the last day so an active read's open-end cap + pulse dot (which extend ~26px
// beyond the bar at the today line) are always visible without horizontal scroll.
export const RIGHT_GUTTER = 32;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const startOfToday = (): Date => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const earliestCycleStart = (books: TimelineBook[]): Date | null => {
  let earliest: Date | null = null;
  for (const book of books) {
    for (const cycle of book.cycles) {
      const d = parseDateLocal(cycle.start);
      if (!earliest || d < earliest) earliest = d;
    }
  }
  return earliest;
};

export const getViewRange = (
  horizon: Horizon,
  books: TimelineBook[],
  today: Date
): { start: Date; end: Date } => {
  switch (horizon) {
    case '1m': {
      const s = new Date(today);
      s.setMonth(s.getMonth() - 1);
      return { start: s, end: today };
    }
    case '3m': {
      const s = new Date(today);
      s.setMonth(s.getMonth() - 3);
      return { start: s, end: today };
    }
    case 'ytd':
      return { start: new Date(today.getFullYear(), 0, 1), end: today };
    case '6m': {
      const s = new Date(today);
      s.setMonth(s.getMonth() - 6);
      return { start: s, end: today };
    }
    case '1y': {
      const s = new Date(today);
      s.setFullYear(s.getFullYear() - 1);
      return { start: s, end: today };
    }
    case 'all': {
      const earliest = earliestCycleStart(books) ?? new Date(today.getFullYear(), 0, 1);
      return { start: timeMonth.floor(earliest), end: today };
    }
  }
};

export interface DateRange {
  start: string;
  end: string;
}

const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * The date range to filter on server-side for a horizon, as YYYY-MM-DD strings. Returns undefined
 * for 'all' (no bound — the server returns every book). Bounded horizons derive purely from `today`,
 * so no book data is needed to compute them.
 */
export const getApiRange = (horizon: Horizon, today: Date): DateRange | undefined => {
  if (horizon === 'all') return undefined;
  const { start, end } = getViewRange(horizon, [], today);
  return { start: toISODate(start), end: toISODate(end) };
};

export interface ScaleModel {
  viewStart: Date;
  viewEnd: Date;
  totalWidth: number;
  x: ScaleTime<number, number>;
  monthCells: { label: string; width: number; left: number }[];
  monthLines: number[];
  weekLines: number[];
  todayX: number | null;
}

/**
 * Builds the time scale. `minWidth` is the available viewport width — when a horizon is short
 * enough that its natural day-pixel width would leave empty gutter, the scale stretches to fill
 * `minWidth` instead, so the timeline is always full-bleed. Longer ranges overflow and scroll.
 */
export const buildScaleModel = (viewStart: Date, viewEnd: Date, minWidth = 0): ScaleModel => {
  const viewEndExclusive = timeDay.offset(viewEnd, 1);
  const totalDays = Math.max(1, timeDay.count(viewStart, viewEndExclusive));
  const totalWidth = Math.max(totalDays * DAY_PX, minWidth);
  const x = scaleTime().domain([viewStart, viewEndExclusive]).range([0, totalWidth]);

  const monthCells: { label: string; width: number; left: number }[] = [];
  let cur = timeMonth.floor(viewStart);
  while (cur < viewEndExclusive) {
    const next = timeMonth.offset(cur, 1);
    const cellStart = cur < viewStart ? viewStart : cur;
    const cellEnd = next < viewEndExclusive ? next : viewEndExclusive;
    const left = x(cellStart);
    monthCells.push({ label: MONTHS[cur.getMonth()], width: x(cellEnd) - left, left });
    cur = next;
  }

  const monthLines = timeMonth.range(viewStart, viewEndExclusive).map((d) => x(d));
  const weekLines = timeMonday.range(viewStart, viewEndExclusive).map((d) => x(d));

  const today = startOfToday();
  const todayX = today >= viewStart && today <= viewEnd ? x(today) : null;

  return { viewStart, viewEnd, totalWidth, x, monthCells, monthLines, weekLines, todayX };
};

/** A bar's geometry within the current scale, or null if the cycle falls outside the view. */
export const cycleBarGeometry = (
  cycleStart: string,
  cycleEnd: string | null,
  model: ScaleModel
): { left: number; width: number } | null => {
  const bs = parseDateLocal(cycleStart);
  const be = cycleEnd ? parseDateLocal(cycleEnd) : model.viewEnd;
  if (bs > model.viewEnd || be < model.viewStart) return null;

  const clampedStart = bs < model.viewStart ? model.viewStart : bs;
  const clampedEnd = be > model.viewEnd ? model.viewEnd : be;
  const left = model.x(clampedStart);
  const right = model.x(timeDay.offset(clampedEnd, 1));
  return { left, width: Math.max(right - left, MIN_BAR_PX) };
};
