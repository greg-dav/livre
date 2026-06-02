import styled from 'styled-components';
import { SIDEBAR_PANEL_WIDTH } from '../../lib/layout';

export const Split = styled('div')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
});

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
}));

export const ShelfHeading = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(7),
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
