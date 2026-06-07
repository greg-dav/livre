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
    // The bar is portaled to <body> so bottom:0 reaches the physical screen edge (see BottomNav.tsx).
    // Grow it by the home-indicator inset and pad by that inset, so its background fills down to the
    // edge while the tab row keeps its height above the indicator. Matches the Body's bottom
    // clearance; the inset is 0 where there is no home indicator.
    height: `calc(${theme.spacing(16)} + env(safe-area-inset-bottom))`,
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
