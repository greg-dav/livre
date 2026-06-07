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
    // Just the tab row — no safe-area inset baked in. In an iOS standalone PWA the layout viewport
    // excludes the home-indicator inset, so a fixed bottom:0 element can't extend past the safe-area
    // line anyway; the indicator strip below the bar is filled by the body's bgElevated background
    // (see LivreThemeProvider) for one continuous surface to the edge. Baking the inset into this
    // bar's height/padding too would double it and float the icons up. Body clearance matches.
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
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  color: $active ? theme.accent : theme.textMuted,
  transition: 'color 0.15s',
}));
