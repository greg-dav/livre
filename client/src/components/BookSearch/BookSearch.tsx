import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input, Text } from '@livre/primitives';
import { type BookSearchResult, type ShelfEntry, type ShelfStatus } from '@livre/types';
import { api } from '../../lib/api';
import { useDebounce } from './useDebounce';
import {
  Container,
  Dropdown,
  ResultItem,
  Thumbnail,
  ThumbnailPlaceholder,
  ResultInfo,
  StatusRow,
  SectionLabel,
  SectionDivider,
  ShelfBadge,
} from './BookSearch.styles';

const SHELF_LABELS: Record<ShelfStatus, string> = {
  want: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
  dnf: 'DNF',
};

/**
 * Inline book search for the top bar. Library books are matched locally (instant, no debounce)
 * from cached data; Google Books results fill in after the 300ms debounce. Results already in
 * the library are promoted to a "From your library" section and deduped from the Google results.
 * Library books that match Google Books results but not the local filter get a status badge inline.
 */
export const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data: searchData, isFetching } = useQuery({
    queryKey: ['books', 'search', debouncedQuery],
    queryFn: () => api.books.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 60_000,
  });

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  // Instant local filter over library — uses raw query, not debounced, for immediate response
  const localMatches = useMemo(() => {
    if (!libraryData || query.length <= 1) return [];
    const q = query.toLowerCase();
    return libraryData.filter(
      (e) => e.title.toLowerCase().includes(q) || e.authors.some((a) => a.toLowerCase().includes(q))
    );
  }, [libraryData, query]);

  const localMatchIds = useMemo(
    () => new Set(localMatches.map((e) => e.googleId).filter((id): id is string => id !== null)),
    [localMatches]
  );

  // All library IDs → used to badge Google Books results that are saved but not locally matched
  const libraryStatusMap = useMemo(
    () =>
      new Map(
        (libraryData ?? [])
          .filter((e): e is ShelfEntry & { googleId: string } => e.googleId !== null)
          .map((e) => [e.googleId, e.status])
      ),
    [libraryData]
  );

  // Google Books results minus books already shown in the local library section
  const googleResults = useMemo(
    () => (searchData?.results ?? []).filter((r) => !localMatchIds.has(r.googleId)),
    [searchData, localMatchIds]
  );

  const showDropdown = open && query.length > 1;
  const nothingToShow =
    localMatches.length === 0 &&
    googleResults.length === 0 &&
    !isFetching &&
    debouncedQuery.length > 1;

  const handleNavigate = (googleId: string) => {
    setQuery('');
    setOpen(false);
    navigate(`/book/${googleId}`);
  };

  const renderLibraryResult = (entry: ShelfEntry) => {
    const googleId = entry.googleId;
    if (!googleId) return null;
    return (
      <ResultItem key={entry.userBookId} onClick={() => handleNavigate(googleId)}>
        {entry.coverUrl ? <Thumbnail src={entry.coverUrl} alt="" /> : <ThumbnailPlaceholder />}
        <ResultInfo>
          <Text variant="ui-sm">{entry.title}</Text>
          <Text variant="ui-xs" color="muted">
            {entry.authors.join(', ')}
          </Text>
        </ResultInfo>
        <ShelfBadge>
          <Text variant="label" color="accent">
            {SHELF_LABELS[entry.status]}
          </Text>
        </ShelfBadge>
      </ResultItem>
    );
  };

  const renderGoogleResult = (book: BookSearchResult) => {
    const libraryStatus = libraryStatusMap.get(book.googleId);
    return (
      <ResultItem key={book.googleId} onClick={() => handleNavigate(book.googleId)}>
        {book.thumbnail ? <Thumbnail src={book.thumbnail} alt="" /> : <ThumbnailPlaceholder />}
        <ResultInfo>
          <Text variant="ui-sm">{book.title}</Text>
          <Text variant="ui-xs" color="muted">
            {[book.authors.join(', '), book.publishedDate?.slice(0, 4)].filter(Boolean).join(' · ')}
          </Text>
        </ResultInfo>
        {libraryStatus !== undefined && (
          <ShelfBadge>
            <Text variant="label" color="accent">
              {SHELF_LABELS[libraryStatus]}
            </Text>
          </ShelfBadge>
        )}
      </ResultItem>
    );
  };

  return (
    <Container>
      <Input
        type="search"
        placeholder="Search by title or author…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {showDropdown && (
        <Dropdown>
          {localMatches.length > 0 && (
            <>
              <SectionLabel>
                <Text variant="label" color="muted">
                  From your library
                </Text>
              </SectionLabel>
              {localMatches.map(renderLibraryResult)}
              {googleResults.length > 0 && <SectionDivider />}
            </>
          )}
          {isFetching && localMatches.length === 0 && (
            <StatusRow>
              <Text variant="ui-sm" color="muted">
                Searching…
              </Text>
            </StatusRow>
          )}
          {nothingToShow && (
            <StatusRow>
              <Text variant="ui-sm" color="muted">
                No results for "{debouncedQuery}"
              </Text>
            </StatusRow>
          )}
          {googleResults.map(renderGoogleResult)}
        </Dropdown>
      )}
    </Container>
  );
};
