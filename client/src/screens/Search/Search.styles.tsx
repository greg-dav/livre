import styled from 'styled-components';
import { SIDEBAR_PANEL_WIDTH } from '../../lib/layout';

export const Split = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  // Stack the refinement rail above the results on mobile (one page-scrolling column).
  [theme.media.mobile]: {
    display: 'block',
  },
}));

// Left refinement rail — mirrors the Library facet panel (elevated surface, right divider).
export const LeftRail = styled('aside')(({ theme }) => ({
  width: `${SIDEBAR_PANEL_WIDTH}px`,
  flexShrink: 0,
  borderRight: `1px solid ${theme.borderSoft}`,
  overflowY: 'auto',
  padding: `${theme.spacing(6)} ${theme.spacing(4.5)} ${theme.spacing(10)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  background: theme.bg,
  // On mobile the rail is replaced by the MobileFacets chip scroller above the results.
  [theme.media.mobile]: {
    display: 'none',
  },
}));

// Mobile-only wrapper that hosts the shared Facet.List (which renders as a horizontal chip scroller
// below the breakpoint) in place of the desktop rail. Sits just under the query bar.
export const MobileFacets = styled('div')(({ theme }) => ({
  display: 'none',
  [theme.media.mobile]: {
    display: 'block',
    paddingTop: theme.spacing(3),
  },
}));

export const PanelHeader = styled('div')<{ $spaced?: boolean }>(({ theme, $spaced }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  marginBottom: theme.spacing(1),
  ...($spaced && { marginTop: theme.spacing(3.5) }),
}));

export const PanelDivider = styled('hr')(({ theme }) => ({
  flex: 1,
  border: 'none',
  borderTop: `1px solid ${theme.borderSoft}`,
  margin: 0,
}));

export const RightCol = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  [theme.media.mobile]: {
    overflowY: 'visible',
  },
}));

export const QueryBar = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 5,
  background: theme.bg,
  borderBottom: `1px solid ${theme.borderSoft}`,
  padding: `${theme.spacing(4.5)} ${theme.spacing(9)}`,
  [theme.media.mobile]: {
    // Not sticky on mobile — the page scrolls as one column, so a sticky bar would float oddly.
    position: 'static',
    padding: `${theme.spacing(4)} ${theme.spacing(4)}`,
  },
}));

export const Field = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.lg,
  padding: `11px ${theme.spacing(4)}`,
  color: theme.textMuted,
  transition: 'border-color 0.15s',
  '&:focus-within': { borderColor: theme.accent },
}));

/*
 * The query field is the page's primary expression — it carries the display serif italic to echo
 * the book titles it searches for. <input> can't compose <Text>, so font properties are set here:
 * a bounded exception to the no-fontFamily-outside-Text rule, justified at the input boundary and
 * mirroring the top-bar SearchInput precedent.
 */
export const FieldInput = styled('input')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  border: 'none',
  background: 'none',
  outline: 'none',
  color: theme.text,
  fontFamily: theme.fontDisplay,
  fontStyle: 'italic',
  fontWeight: 500,
  fontSize: '1.25rem',
  letterSpacing: '-0.01em',
  '&::placeholder': { color: theme.textMuted, opacity: 1 },
}));

// Persistent invitation under the bar to add a book by hand — shown regardless of results, since a
// missing book is rare enough that gating this behind an empty result set would only bury it.
export const ManualHint = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  paddingLeft: theme.spacing(0.5),
  // On a phone the prompt + button collide when wrapped inline; stack them so the action sits cleanly
  // on its own line beneath the question.
  [theme.media.mobile]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
  },
}));

export const ManualHintButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  cursor: 'pointer',
  color: theme.accent,
  transition: 'opacity 0.15s',
  flexShrink: 0,
  '&:hover': { opacity: 0.75 },
}));

export const Results = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(6)} ${theme.spacing(9)} ${theme.spacing(20)}`,
  [theme.media.mobile]: {
    padding: `${theme.spacing(5)} ${theme.spacing(4)} ${theme.spacing(6)}`,
  },
}));

// Fixed height so the row doesn't grow when the query state swaps the plain prompt for the taller
// count + sort control — that height change was shifting the whole result list as you typed.
export const Toolbar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: theme.spacing(8),
  marginBottom: theme.spacing(4.5),
}));

export const HeadLine = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
});

export const ActiveChips = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(5.5),
  minHeight: '1px',
}));

export const Chip = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: `4px ${theme.spacing(2.5)}`,
  borderRadius: '999px',
  background: theme.accentSoft,
}));

export const ChipClose = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'pointer',
  opacity: 0.7,
  color: theme.accent,
  transition: 'opacity 0.15s',
  '&:hover': { opacity: 1 },
}));

export const StateNote = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(5)} 2px`,
  fontStyle: 'italic',
}));
