import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input, Text } from '@livre/primitives';
import { type BookSearchResult } from '@livre/types';
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
} from './BookSearch.styles';

/**
 * Inline book search for the top bar. Queries Google Books via the server with a 300ms debounce
 * and renders results in a dropdown. Clicking a result navigates to the book detail page, which
 * fetches the full volume data independently.
 */
export const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['books', 'search', debouncedQuery],
    queryFn: () => api.books.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  const showDropdown = open && query.length > 1;
  const results = data?.results ?? [];

  const handleSelect = (book: BookSearchResult) => {
    setQuery('');
    setOpen(false);
    navigate(`/book/${book.googleId}`);
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
          {isFetching && (
            <StatusRow>
              <Text variant="ui-sm" color="muted">
                Searching…
              </Text>
            </StatusRow>
          )}
          {!isFetching && results.length === 0 && (
            <StatusRow>
              <Text variant="ui-sm" color="muted">
                No results for "{debouncedQuery}"
              </Text>
            </StatusRow>
          )}
          {results.map((book) => (
            <ResultItem key={book.googleId} onClick={() => handleSelect(book)}>
              {book.thumbnail ? (
                <Thumbnail src={book.thumbnail} alt="" />
              ) : (
                <ThumbnailPlaceholder />
              )}
              <ResultInfo>
                <Text variant="ui-sm">{book.title}</Text>
                <Text variant="ui-xs" color="muted">
                  {[book.authors.join(', '), book.publishedDate?.slice(0, 4)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </ResultInfo>
            </ResultItem>
          ))}
        </Dropdown>
      )}
    </Container>
  );
};
