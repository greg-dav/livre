import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { themes, type ThemeName } from './themes';
import GlobalStyle from './GlobalStyle';

interface LivreThemeProviderProps {
  theme?: ThemeName;
  children: ReactNode;
}

const LivreThemeProvider = ({ theme = 'roman-light', children }: LivreThemeProviderProps) => (
  <ThemeProvider theme={themes[theme].tokens}>
    <GlobalStyle />
    {children}
  </ThemeProvider>
);

export default LivreThemeProvider;
