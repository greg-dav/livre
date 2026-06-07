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
    // Dip the bar down INTO the home-indicator safe area so the icons sit ~16px above the screen
    // edge — like native tab bars (YouTube et al.) — instead of being stranded the full ~34px inset
    // above it, which reads as a too-tall bar. A PWA's fixed bottom:0 is otherwise capped at the
    // safe-area line. min(…, 0px) guards devices with no/small inset: it only ever pulls down, never
    // floats the bar up off the edge. The body's bgElevated background (see LivreThemeProvider) still
    // covers the thin strip left below the bar.
    bottom: 'min(calc(16px - env(safe-area-inset-bottom)), 0px)',
    zIndex: 100,
    alignItems: 'stretch',
    // Just the tab row — no safe-area inset baked into the height (the dip above handles the edge).
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
