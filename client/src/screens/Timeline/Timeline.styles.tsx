import styled from 'styled-components';
import { SIDEBAR_PANEL_WIDTH } from '../../lib/layout';

type CycleStatus = 'reading' | 'read' | 'dnf';

/* ── Screen ───────────────────────────────────────────────── */
// Fills the shell's fullWidth Body; the gantt area takes the whole width and the filter dock floats
// over it. `relative` so the dock can anchor to the bottom-right corner.
export const Screen = styled('div')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  height: '100%',
  position: 'relative',
});

/* ── Filter dock ──────────────────────────────────────────────
 * A chip pinned to the bottom-right showing the active period; clicking it opens a Popover (handled
 * by @livre/primitives) with the period picker. The dock just anchors the chip to the corner — all
 * positioning, portal, and dismiss are the Popover's job.
 */
export const FilterDock = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(6),
  right: theme.spacing(6),
  zIndex: 20,
}));

export const ChipHead = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: `${theme.spacing(2)} ${theme.spacing(3.5)}`,
  borderRadius: theme.radius.full,
  border: `1px solid ${theme.border}`,
  background: theme.bgElevated,
  cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
  transition: 'border-color 0.13s',
  '& svg': { color: theme.textMuted, transition: 'color 0.13s' },
  // `data-state="open"` is set by the Popover trigger while the panel is up.
  '&:hover, &[data-state="open"]': { borderColor: theme.accent },
  '&:hover svg, &[data-state="open"] svg': { color: theme.accent },
}));

// Leading radio tick on the active period row, paired with Popover.Item's accent highlight.
export const HorizonTick = styled('span')<{ $active: boolean }>(({ theme, $active }) => ({
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  border: `1.5px solid ${$active ? theme.accent : theme.border}`,
  background: $active ? theme.accent : 'transparent',
  color: theme.textOnColor,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.13s',
}));

/* ── Gantt area ───────────────────────────────────────────── */
// Fills the full screen width; holds the gantt (or a centered loading/empty state). The gantt's own
// book column is SIDEBAR_PANEL_WIDTH wide, subtracted from this width for the scale.
export const Main = styled('div')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

/* ── Gantt shell ──────────────────────────────────────────────
 * One scroll container, not two. A CSS grid with a fixed book column and a timeline column; the
 * header is `sticky top`, the book column `sticky left`, the corner both. Native scrolling keeps
 * every region in lockstep with zero JS sync — eliminating the drift two synced scrollers produce.
 */
export const GanttScroll = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  background: theme.bg,
}));

export const GanttGrid = styled('div')<{ $timelineWidth: number }>(({ $timelineWidth }) => ({
  display: 'grid',
  gridTemplateColumns: `${SIDEBAR_PANEL_WIDTH}px ${$timelineWidth}px`,
  gridTemplateRows: 'auto 1fr',
  minHeight: '100%',
}));

// Top-left BOOK header — pinned on both axes so it covers the corner during any scroll.
export const Corner = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  left: 0,
  zIndex: 6,
  height: theme.spacing(7),
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${theme.spacing(4)}`,
  background: theme.bg,
  borderRight: `1px solid ${theme.borderSoft}`,
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

export const BookListCol = styled('div')(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 4,
  borderRight: `1px solid ${theme.borderSoft}`,
  background: theme.bg,
  display: 'flex',
  flexDirection: 'column',
}));

export const BookRowLabel = styled('div')<{ $activeReading?: boolean }>(
  ({ theme, $activeReading }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2.5),
    padding: `0 ${theme.spacing(3.5)}`,
    height: theme.spacing(15),
    borderBottom: `1px solid ${theme.borderSoft}`,
    cursor: 'pointer',
    transition: 'background 0.15s',
    flexShrink: 0,
    background: $activeReading ? theme.accentSoft : 'transparent',
    '&:hover': { background: theme.accentSoft },
  })
);

export const BrlCover = styled('div')<{ $color?: string }>(({ theme, $color }) => ({
  width: theme.spacing(7.5),
  height: theme.spacing(11.25),
  borderRadius: '2px 4px 4px 2px',
  flexShrink: 0,
  boxShadow: '1px 1px 4px rgba(0,0,0,0.22)',
  backgroundColor: $color ?? theme.bgSunken,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

export const BrlInfo = styled('div')({ flex: 1, minWidth: 0 });

// Truncation lives on the inner Text element (via `& > *`), not this wrapper, so the ellipsis glyph
// renders in the text's own font/size/color instead of the wrapper's browser default.
export const BrlText = styled('div')({
  minWidth: 0,
  '& > *': {
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const BrlStatus = styled('div')<{ $status: CycleStatus }>(({ theme, $status }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  flexShrink: 0,
  ...($status === 'reading'
    ? { background: theme.accent, boxShadow: `0 0 0 3px ${theme.accentSoft}` }
    : $status === 'read'
      ? { background: theme.success }
      : { background: theme.textMuted, opacity: 0.5 }),
}));

/* ── Timeline column ──────────────────────────────────────── */
// Header row of the grid — pinned to the top, scrolls horizontally with the timeline body.
export const TimelineHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 3,
  height: theme.spacing(7),
  background: theme.bg,
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

export const MonthRow = styled('div')({
  position: 'relative',
  height: '100%',
});

// Absolutely positioned at its month line so the label hugs the boundary by a fixed 6px regardless
// of column width — flex cells with proportional padding made labels float mid-column on dense
// (1 yr) horizons.
export const MonthCell = styled('div')<{ $left: number; $width: number }>(({ $left, $width }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: `${$left}px`,
  width: `${$width}px`,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '6px',
  userSelect: 'none',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
}));

// Header month divider, positioned from the same scale as the body grid lines so the two never
// drift (per-cell borders accumulate 1px of box-model error per month and visibly desync).
export const HeaderGridLine = styled('div')<{ $left: number }>(({ theme, $left }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: `${$left}px`,
  width: '1px',
  background: theme.borderSoft,
  pointerEvents: 'none',
}));

export const GanttRows = styled('div')({
  position: 'relative',
  minHeight: '100%',
});

export const GanttRow = styled('div')(({ theme }) => ({
  height: theme.spacing(15),
  borderBottom: `1px solid ${theme.borderSoft}`,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  '&:nth-child(even)': { background: 'rgba(0,0,0,0.012)' },
}));

export const GridLine = styled('div')<{ $left: number; $variant: 'month' | 'week' | 'today' }>(
  ({ theme, $left, $variant }) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
    left: `${$left}px`,
    width: $variant === 'today' ? '2px' : '1px',
    background: $variant === 'today' ? theme.accent : theme.borderSoft,
    opacity: $variant === 'today' ? 0.7 : $variant === 'week' ? 0.45 : 1,
  })
);

// Spans the full header height with flex centering — identical mechanism to MonthCell — so the
// label sits on exactly the same baseline as the month labels (top:50%/translate centered against a
// different box and landed a hair low). The full-height bg also masks the today line behind it.
export const TodayLabel = styled('div')<{ $left: number }>(({ theme, $left }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: `${$left}px`,
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  background: theme.bg,
  padding: `0 ${theme.spacing(1)}`,
  pointerEvents: 'none',
  zIndex: 1,
}));

/* ── Bars ─────────────────────────────────────────────────── */
export const GanttBar = styled('button')<{ $left: number; $width: number; $status: CycleStatus }>(
  ({ theme, $left, $width, $status }) => ({
    position: 'absolute',
    height: theme.spacing(7),
    left: `${$left}px`,
    width: `${$width}px`,
    borderRadius: theme.radius.sm,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: 0,
    transition: 'filter 0.15s, box-shadow 0.15s',
    overflow: 'visible',
    ...($status === 'read'
      ? {
          background: `color-mix(in srgb, ${theme.success} 18%, transparent)`,
          border: `1.5px solid color-mix(in srgb, ${theme.success} 55%, transparent)`,
        }
      : $status === 'reading'
        ? {
            background: theme.accentSoft,
            border: `1.5px solid ${theme.accent}`,
            // Dashed right edge marks the read as unfinished — it sits flush on the today line so the
            // bar never extends past today.
            borderRight: `1.5px dashed ${theme.accent}`,
          }
        : {
            background: `color-mix(in srgb, ${theme.textMuted} 12%, transparent)`,
            border: `1.5px solid color-mix(in srgb, ${theme.textMuted} 35%, transparent)`,
          }),
    '&:hover': {
      filter: 'brightness(1.05)',
      boxShadow: '0 3px 12px rgba(0,0,0,0.18)',
      zIndex: 10,
    },
  })
);

// Truncation lives on the inner Text element (via `& > *`), not this wrapper, so the ellipsis glyph
// renders in the text's own font/size/color instead of the wrapper's browser default.
export const BarInnerLabel = styled('div')({
  paddingLeft: '8px',
  minWidth: 0,
  maxWidth: 'calc(100% - 16px)',
  pointerEvents: 'none',
  userSelect: 'none',
  opacity: 0.7,
  '& > *': {
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const BarEventDot = styled('div')<{ $left: number; $variant: 'note' | 'quote' }>(
  ({ theme, $left, $variant }) => ({
    position: 'absolute',
    top: '50%',
    left: `${$left}px`,
    transform: 'translate(-50%, -50%)',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    zIndex: 2,
    transition: 'transform 0.1s',
    ...($variant === 'quote'
      ? { background: theme.accent, border: `1.5px solid ${theme.bgElevated}` }
      : { background: theme.bgElevated, border: `1.5px solid ${theme.textMuted}` }),
    '&:hover': { transform: 'translate(-50%, -50%) scale(1.6)' },
  })
);

// Single cursor-following hover card, fixed-positioned and pointer-driven from Gantt state — one
// element for the whole grid instead of a tooltip per bar/dot, so there's no per-element flicker
// and it escapes the scroll container's clipping. Sits just above the pointer.
export const HoverCard = styled('div')<{ $x: number; $y: number }>(({ theme, $x, $y }) => ({
  position: 'fixed',
  left: `${$x}px`,
  top: `${$y}px`,
  transform: 'translate(-50%, -100%)',
  marginTop: theme.spacing(-2),
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  padding: `${theme.spacing(1.5)} ${theme.spacing(2.5)}`,
  borderRadius: theme.radius.md,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  zIndex: 200,
  boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
}));

export const CenterState = styled('div')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(10),
}));

/* ── Expanded log dialog ──────────────────────────────────────
 * Header is one row whose height is set by the cover: cover, a meta column (title · author · rating),
 * then the "View book" action (a standard secondary Button) on the right. Everything is centered on
 * the cross axis so the meta block and the button both sit vertically centered against the cover —
 * the rating reads as the closing line of a balanced stack rather than dangling below it, and the
 * button is centered whether or not a rating is present. A divider separates it from the log, which
 * scrolls within the dialog's capped height while the header stays put.
 */
export const DialogHead = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderBottom: `1px solid ${theme.borderSoft}`,
  flexShrink: 0,
}));

export const DialogCover = styled('div')<{ $color?: string }>(({ theme, $color }) => ({
  width: theme.spacing(12),
  height: theme.spacing(18),
  borderRadius: '2px 5px 5px 2px',
  flexShrink: 0,
  boxShadow: '2px 3px 10px rgba(0,0,0,0.24)',
  backgroundColor: $color ?? theme.bgSunken,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

export const DialogHeadMeta = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const DialogRating = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(0.5),
}));

// Fills the remaining dialog height and scrolls; the header above stays fixed. `overflow-y: auto`
// forces overflow-x to clip, so a little left padding keeps the journal pins (drawn at left:-1px)
// from being cut, and right padding keeps the scrollbar off the content.
export const DialogBody = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(2),
}));
