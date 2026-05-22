import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Text, BookCard, BookGrid } from '@livre/primitives';
import { api } from '../../lib/api';
import { Layout } from '../../components';

/**
 * All books by a single author, fetched via a Google Books author search. Navigated to by
 * clicking an author name on the BookDetail screen. Each book card navigates to its detail page,
 * which fetches the full volume data independently.
 */
export const Author = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['books', 'author', name],
    queryFn: () => api.books.byAuthor(name!),
    enabled: !!name,
  });

  const books = data?.results ?? [];

  const handleBookClick = (book: { googleId: string }) => {
    navigate(`/book/${book.googleId}`);
  };

  return (
    <Layout>
      <Text variant="h3" as="h1">
        {name}
      </Text>

      {isFetching && (
        <Text variant="ui-sm" color="muted">
          Loading…
        </Text>
      )}

      {!isFetching && books.length === 0 && (
        <Text variant="ui-sm" color="muted">
          No books found for this author.
        </Text>
      )}

      {books.length > 0 && (
        <BookGrid>
          {books.map((book) => (
            <BookCard
              key={book.googleId}
              title={book.title}
              author={book.authors[0] ?? ''}
              coverUrl={book.largeThumbnail ?? book.thumbnail}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </BookGrid>
      )}
    </Layout>
  );
};
