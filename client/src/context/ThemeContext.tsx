import { createContext, useContext, useState, type ReactNode } from 'react';
import { LivreThemeProvider, type ThemeName } from '@livre/ui';
import { PrimitivesGlobalStyle } from '@livre/primitives';

interface ThemeState {
  theme: ThemeName;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = 'livre_theme';

const getInitialTheme = (): ThemeName =>
  (localStorage.getItem(STORAGE_KEY) as ThemeName) ?? 'roman-light';

/**
 * Owns theme selection and persistence. Wraps LivreThemeProvider so consumers don't need to
 * wire theme state manually — call useTheme() anywhere inside to read or toggle the theme.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'roman-light' ? 'roman-dark' : 'roman-light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <LivreThemeProvider theme={theme}>
        <PrimitivesGlobalStyle />
        {children}
      </LivreThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeState => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
