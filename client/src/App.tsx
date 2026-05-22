import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Library, Login, Setup, BookDetail, Author } from './screens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/setup" element={user ? <Navigate to="/" replace /> : <Setup />} />
      <Route
        path="/book/:googleId"
        element={user ? <BookDetail /> : <Navigate to="/login" replace />}
      />
      <Route path="/author/:name" element={user ? <Author /> : <Navigate to="/login" replace />} />
      <Route path="/*" element={user ? <Library /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

/**
 * Root of the app. ThemeProvider wraps everything so auth screens inherit the theme. AuthProvider
 * sits inside so it can call the API. AppRoutes reads auth state to decide which screen to render.
 */
export const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
