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

export const LivreThemeProvider = ({
  theme = 'roman-light',
  children,
}: LivreThemeProviderProps) => (
  <ThemeProvider theme={themes[theme].tokens}>
    <GlobalStyle />
    {children}
  </ThemeProvider>
);
