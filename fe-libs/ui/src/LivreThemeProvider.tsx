import type { ReactNode } from 'react';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { themes, type ThemeName } from './themes';

const GlobalStyle = createGlobalStyle(({ theme }) => ({
  '*, *::before, *::after': {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  html: {
    fontSize: '16px',
    WebkitFontSmoothing: 'antialiased',
  },
  body: {
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily: theme.fontUi,
    minHeight: '100dvh',
    transition: 'background-color 0.2s, color 0.2s',
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
