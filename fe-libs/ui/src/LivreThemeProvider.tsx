import type { ReactNode } from 'react';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { themes, type ThemeName } from './themes';

const GlobalStyle = createGlobalStyle(({ theme }) => ({
  '*, *::before, *::after': {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  // Reset the user-agent button chrome. Without this a bare <button> inherits system colors
  // (ButtonFace/ButtonBorder) that track the OS appearance — so on a light theme under macOS dark
  // mode it renders with a dark fill and a stray border. Components that need a surface (Button, the
  // pill selectors) set their own background/border, which still wins over this baseline.
  button: {
    background: 'none',
    border: 'none',
    font: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
  },
  // Disables the trackpad/touch overscroll bounce so the sticky TopBar doesn't get dragged off
  // the top of the viewport on Mac/iOS. Also stops scroll chaining to any parent context.
  'html, body': {
    overscrollBehavior: 'none',
  },
  // Hide scrollbars everywhere while keeping scroll behaviour intact. Firefox honours
  // scrollbar-width; WebKit/Blink need the ::-webkit-scrollbar reset.
  '*': {
    scrollbarWidth: 'none',
  },
  '*::-webkit-scrollbar': {
    display: 'none',
  },
  html: {
    fontSize: '16px',
    WebkitFontSmoothing: 'antialiased',
  },
  body: {
    // bgElevated, not bg, on purpose. The body background is never visible behind app content —
    // the Page shell covers the whole viewport with its own theme.bg, and the in-flow Header paints
    // the top safe-area inset. The one place the body shows through is the iOS home-indicator strip
    // below the *fixed* BottomNav: a fixed bottom:0 bar anchors to the top of that inset and its
    // padding grows upward, so the bar's bgElevated never reaches the strip. Painting the body
    // bgElevated makes that strip match the nav instead of showing the lighter page cream.
    backgroundColor: theme.bgElevated,
    color: theme.text,
    fontFamily: theme.fontUi,
    minHeight: '100dvh',
    transition: 'background-color 0.2s, color 0.2s',
  },
  '::selection': {
    background: theme.accentSoft,
  },
}));

interface LivreThemeProviderProps {
  theme?: ThemeName;
  children: ReactNode;
}

/**
 * Must wrap the entire app exactly once. Applies theme tokens to styled-components and injects
 * global CSS resets. Defaults to 'roman-light'; pass `theme` to let the user's saved preference
 * override it. Never nest a second instance — tokens will shadow unpredictably.
 */
export const LivreThemeProvider = ({
  theme = 'roman-light',
  children,
}: LivreThemeProviderProps) => (
  <ThemeProvider theme={themes[theme].tokens}>
    <GlobalStyle />
    {children}
  </ThemeProvider>
);
