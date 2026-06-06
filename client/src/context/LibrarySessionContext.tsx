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
 * Changing the view (shelf or tags) keeps the current scroll offset so refining stays in place;
 * returning from a detail page restores exactly where the user left off. Scoped inside AuthGuard.
 */
export const LibrarySessionProvider = ({ children }: LibrarySessionProviderProps) => {
  const { pathname } = useLocation();
  const [activeShelf, setActiveShelfState] = useState<ShelfStatus>(DEFAULT_SHELF);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const scrollRef = useRef(0);

  // Shelf/tag changes deliberately leave scrollRef alone, so the current offset is held and refining
  // a view keeps the user in place instead of jumping. Only a full session reset (leaving to a
  // sibling section, below) zeroes the scroll.
  const setActiveShelf = useCallback((shelf: ShelfStatus) => {
    setActiveShelfState(shelf);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearTags = useCallback(() => {
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
