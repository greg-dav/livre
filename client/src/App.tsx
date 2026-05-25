import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { Library, Login, Setup, SearchBookDetail, LibraryBookDetail, Author } from './screens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const AuthGuard = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <LibraryProvider>
      <Outlet />
    </LibraryProvider>
  );
};

const PublicGuard = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/library" replace /> : <Outlet />;
};

const DefaultRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? '/library' : '/login'} replace />;
};

const AppRoutes = () => {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route element={<PublicGuard />}>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route path="/library" element={<Library />} />
        <Route path="/library/:libraryBookId" element={<LibraryBookDetail />} />
        <Route path="/search/book/:bookRef" element={<SearchBookDetail />} />
        <Route path="/search/author/:name" element={<Author />} />
      </Route>
      <Route path="*" element={<DefaultRedirect />} />
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
