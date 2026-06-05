import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { type ShelfStatus } from '../components';

interface LibrarySession {
  activeShelf: ShelfStatus;
  setActiveShelf: (shelf: ShelfStatus) => void;
  selectedTags: ReadonlySet<string>;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  // Saved scroll offset of the shelf browser. A ref, not state, so the high-frequency scroll
  // events that feed it never trigger a re-render; the screen reads/writes `.current` directly.
  scrollRef: MutableRefObject<number>;
}

const LibrarySessionContext = createContext<LibrarySession | null>(null);

const DEFAULT_SHELF: ShelfStatus = 'read';

// Landing on another section's root ends the library browsing session. The detail routes reachable
// *from* the library — a library book (`/library/:id`), a book or author page under `/search/*` —
// are deliberately absent here, so diving into one and coming back preserves shelf, tags, and
// scroll. Only a deliberate jump to a sibling section starts the library fresh.
const RESET_PATHS = new Set(['/log', '/search', '/settings']);

interface LibrarySessionProviderProps {
  children: ReactNode;
}

/**
 * Holds the live library browsing session — active shelf, tag selection, and scroll offset — above
 * the route tree so it survives diving into a book or author detail and returning. This is the cure
 * for the "lose your place" problem: jumping to anything reachable from the library leaves the
 * session intact, and only navigating to a sibling section (Log, Search, Settings) resets it.
 * Changing the view (shelf or tags) zeroes the saved scroll so each new selection starts at the top,
 * while an unchanged view restores exactly where the user left off. Scoped inside AuthGuard.
 */
export const LibrarySessionProvider = ({ children }: LibrarySessionProviderProps) => {
  const { pathname } = useLocation();
  const [activeShelf, setActiveShelfState] = useState<ShelfStatus>(DEFAULT_SHELF);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const scrollRef = useRef(0);

  const setActiveShelf = useCallback((shelf: ShelfStatus) => {
    scrollRef.current = 0;
    setActiveShelfState(shelf);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    scrollRef.current = 0;
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearTags = useCallback(() => {
    scrollRef.current = 0;
    // Keep the same empty Set instance when already clean so a no-op clear doesn't re-render.
    setSelectedTags((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  useEffect(() => {
    if (!RESET_PATHS.has(pathname)) return;
    scrollRef.current = 0;
    setActiveShelfState(DEFAULT_SHELF);
    setSelectedTags((prev) => (prev.size === 0 ? prev : new Set()));
  }, [pathname]);

  const value = useMemo(
    () => ({ activeShelf, setActiveShelf, selectedTags, toggleTag, clearTags, scrollRef }),
    [activeShelf, setActiveShelf, selectedTags, toggleTag, clearTags]
  );

  return <LibrarySessionContext.Provider value={value}>{children}</LibrarySessionContext.Provider>;
};

export const useLibrarySession = (): LibrarySession => {
  const ctx = useContext(LibrarySessionContext);
  if (!ctx) throw new Error('useLibrarySession must be used within LibrarySessionProvider');
  return ctx;
};
