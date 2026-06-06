import styled from 'styled-components';

// Fixed bottom tab bar, mobile only. Hidden on desktop (the Sidebar rail takes over). Fixed-position
// so it overlays the shell's flex row without disturbing layout; the Body adds matching bottom
// padding so content can scroll clear of it. Shares the TopBar tier on the z-index ladder.
export const Bar = styled('nav')(({ theme }) => ({
  display: 'none',
  [theme.media.mobile]: {
    display: 'flex',
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'stretch',
    // Row height kept near the native iOS tab-bar (~48px) so the icons sit just above the
    // home-indicator inset. Grow the bar by that inset and pad by it, so the row keeps its full
    // height above the indicator instead of being squeezed into it; Matches the Body's bottom
    // clearance, and the inset is 0 where there is no home indicator.
    height: `calc(${theme.spacing(12)} + env(safe-area-inset-bottom))`,
    paddingBottom: 'env(safe-area-inset-bottom)',
    background: theme.bgElevated,
    borderTop: `1px solid ${theme.borderSoft}`,
  },
}));

export const Tab = styled('button')<{ $active?: boolean }>(({ theme, $active }) => ({
  flex: 1,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  color: $active ? theme.accent : theme.textMuted,
  transition: 'color 0.15s',
}));
