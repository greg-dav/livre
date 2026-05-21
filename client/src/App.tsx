import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LivreThemeProvider, type ThemeName } from '@livre/ui';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Library, Login, Setup } from './screens';

const queryClient = new QueryClient();

const AppRoutes = ({ onToggleTheme }: { onToggleTheme: () => void }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/setup" element={user ? <Navigate to="/" replace /> : <Setup />} />
      <Route
        path="/*"
        element={
          user ? <Library onToggleTheme={onToggleTheme} /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

/**
 * Root of the app. Owns theme state so LivreThemeProvider wraps everything including auth
 * screens. AuthProvider sits inside so it can call the API (which requires the Vite proxy
 * but not the theme). AppRoutes reads auth state to decide which screen to render.
 */
export const App = () => {
  const [theme, setTheme] = useState<ThemeName>('roman-light');

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LivreThemeProvider theme={theme}>
          <AuthProvider>
            <AppRoutes
              onToggleTheme={() =>
                setTheme((t) => (t === 'roman-light' ? 'roman-dark' : 'roman-light'))
              }
            />
          </AuthProvider>
        </LivreThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
