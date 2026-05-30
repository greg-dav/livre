import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { themeNameSchema } from '@livre/types';
import { LivreThemeProvider, type ThemeName } from '@livre/ui';
import { PrimitivesGlobalStyle } from '@livre/primitives';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = 'livre_theme';
const DEFAULT_THEME: ThemeName = 'roman-light';

const getInitialTheme = (): ThemeName =>
  themeNameSchema.safeParse(localStorage.getItem(STORAGE_KEY)).data ?? DEFAULT_THEME;

/**
 * Owns theme selection and persistence. localStorage gives an instant, correct first paint before
 * auth resolves; once a user is known their stored theme is authoritative and follows them across
 * devices. Selecting a theme writes through to the server (which re-issues the JWT so the choice
 * survives reloads). Wraps LivreThemeProvider so consumers just call useTheme().
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading, login } = useAuth();
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  // Once auth resolves, the user's saved theme is authoritative; signing out reverts to the
  // default so the next person at this device doesn't inherit the previous user's palette. Skipped
  // while auth is still loading to preserve the instant localStorage paint.
  useEffect(() => {
    if (loading) return;
    const next = user?.theme ?? DEFAULT_THEME;
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [user?.theme, loading]);

  const setTheme = (next: ThemeName) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    if (user) {
      api.account
        .updateTheme(next)
        .then(({ token, user: updated }) => login(token, updated))
        .catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
