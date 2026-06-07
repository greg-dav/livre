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
    // Sits at the bottom of the standalone layout viewport (the safe-area line). A PWA's fixed
    // element is capped here: it can't extend into the home-indicator zone like a native tab bar,
    // and dipping in (a negative bottom) lands tappable content in the system gesture area — which
    // swallows touches and clips the labels at the edge. So the bar stops at the line; the body's
    // bgElevated background (see LivreThemeProvider) fills the indicator strip below it.
    bottom: 0,
    zIndex: 100,
    alignItems: 'stretch',
    // Just the tab row — no safe-area inset baked into the height; the body strip below covers it.
    height: theme.spacing(12),
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
  // Bias the icon+label toward the bottom of the row (a small breather above the safe-area strip)
  // rather than dead-centre: gives cleaner top padding and lets the icons sit close to the
  // home-indicator zone, the way native tab bars read.
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingBottom: '3px',
  gap: theme.spacing(1),
  color: $active ? theme.accent : theme.textMuted,
  transition: 'color 0.15s',
}));
