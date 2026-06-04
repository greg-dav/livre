import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type LibraryResponse } from '@livre/types';
import { api } from '../lib/api';

interface LibraryState {
  library: LibraryResponse | undefined;
}

const LibraryContext = createContext<LibraryState | null>(null);

interface LibraryProviderProps {
  children: ReactNode;
}

/**
 * Owns the flat library list for the authenticated session. staleTime: Infinity means the list
 * only re-fetches when explicitly invalidated — correct, because library membership only changes
 * when books are added or removed, not on status or rating changes. Scoped inside AuthGuard so
 * it never runs for unauthenticated users.
 */
export const LibraryProvider = ({ children }: LibraryProviderProps) => {
  const { data: library } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.library.list(),
    staleTime: Infinity,
  });

  return <LibraryContext.Provider value={{ library }}>{children}</LibraryContext.Provider>;
};

export const useLibrary = (): LibraryState => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
};
