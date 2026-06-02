import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { type SearchScope, type SearchSort, type ShelfFilter } from '@livre/types';

interface SearchSession {
  term: string;
  setTerm: (term: string) => void;
  scope: SearchScope;
  setScope: (scope: SearchScope) => void;
  shelf: ReadonlySet<ShelfFilter>;
  toggleShelf: (key: ShelfFilter) => void;
  sort: SearchSort;
  setSort: (sort: SearchSort) => void;
  reset: () => void;
}

const SearchContext = createContext<SearchSession | null>(null);

// Returning to one of these roots via the nav rail ends the current search session.
const RESET_PATHS = new Set(['/library', '/log']);

interface SearchProviderProps {
  children: ReactNode;
}

/**
 * Holds the live search session — query, scope, shelf filter, and sort — above the route tree so it
 * survives diving into a book or author detail and coming back. The session is deliberately *not*
 * permanent: landing on the Library or Log root clears it, so each return to those screens starts a
 * fresh search rather than resurrecting a stale one. Scoped inside AuthGuard alongside the library.
 */
export const SearchProvider = ({ children }: SearchProviderProps) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // Seed from the URL once so a cold load of a shared /search?q= link starts with the query already
  // in hand — the screen searches on first paint instead of briefly blanking the param.
  const [term, setTerm] = useState(() => searchParams.get('q') ?? '');
  const [scope, setScope] = useState<SearchScope>('anything');
  const [shelf, setShelf] = useState<Set<ShelfFilter>>(new Set());
  const [sort, setSort] = useState<SearchSort>('relevance');

  const reset = useCallback(() => {
    setTerm('');
    setScope('anything');
    setSort('relevance');
    // Keep the same empty Set instance when already clean so a no-op reset doesn't re-render.
    setShelf((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  useEffect(() => {
    if (RESET_PATHS.has(pathname)) reset();
  }, [pathname, reset]);

  const toggleShelf = useCallback((key: ShelfFilter) => {
    setShelf((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <SearchContext.Provider
      value={{ term, setTerm, scope, setScope, shelf, toggleShelf, sort, setSort, reset }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchSession = (): SearchSession => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchSession must be used within SearchProvider');
  return ctx;
};
