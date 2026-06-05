import styled from 'styled-components';
import { SIDEBAR_PANEL_WIDTH } from '../../lib/layout';

export const Split = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  // On mobile the split stacks into one page-scrolling column (the Body owns the scroll).
  [theme.media.mobile]: {
    display: 'block',
  },
}));

export const LeftPanel = styled('div')(({ theme }) => ({
  width: `${SIDEBAR_PANEL_WIDTH}px`,
  flexShrink: 0,
  background: theme.bg,
  borderRight: `1px solid ${theme.borderSoft}`,
  overflowY: 'auto',
  padding: `${theme.spacing(6)} ${theme.spacing(4.5)} ${theme.spacing(10)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  // Full width above the shelf browser; the side border becomes a divider between the stacked panels.
  [theme.media.mobile]: {
    width: 'auto',
    overflowY: 'visible',
    borderRight: 'none',
    borderBottom: `1px solid ${theme.borderSoft}`,
    padding: `${theme.spacing(5)} ${theme.spacing(4)}`,
  },
}));

export const LeftPanelHeader = styled('div')<{ $spaced?: boolean }>(({ theme, $spaced }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  marginBottom: theme.spacing(1),
  ...($spaced && { marginTop: theme.spacing(5) }),
}));

export const LeftPanelDivider = styled('hr')(({ theme }) => ({
  flex: 1,
  border: 'none',
  borderTop: `1px solid ${theme.borderSoft}`,
  margin: 0,
}));

export const RightPanel = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  padding: `${theme.spacing(6)} ${theme.spacing(9)} ${theme.spacing(20)}`,
  [theme.media.mobile]: {
    overflowY: 'visible',
    padding: `${theme.spacing(5)} ${theme.spacing(4)} ${theme.spacing(6)}`,
  },
}));

export const ShelfHeading = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(7),
  [theme.media.mobile]: {
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(5),
  },
}));

export const ShelfHeadingLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(3),
}));

export const EmptyNote = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(5)} 2px`,
  fontStyle: 'italic',
}));

// Quiet hint under the Currently Reading header when nothing is in progress, so the panel reads as
// intentionally empty rather than broken on first login.
export const LeftEmpty = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(0.5)} 0 ${theme.spacing(2)}`,
}));

// First-run state for a brand-new, wholly empty library: a centered line and the three ways in
// (search, import, manual). Deliberately minimal — one line, one row of actions, no onboarding tour.
export const FirstRunEmpty = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: theme.spacing(6),
  padding: `${theme.spacing(16)} ${theme.spacing(4)} ${theme.spacing(10)}`,
}));

export const FirstRunActions = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: theme.spacing(3),
}));
