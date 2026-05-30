import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Text, BookCard, BookGrid, Loader } from '@livre/primitives';
import { type ShelfStatus } from '@livre/types';
import { api } from '../../lib/api';
import { bookPath } from '../../lib/bookPath';
import { Layout } from '../../components';

const STATUS_LABELS: Record<ShelfStatus, string> = {
  want: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
};

/**
 * All books by a single author, fetched via a Google Books author search. Navigated to by
 * clicking an author name on the BookDetail screen. Each book card navigates to its detail
 * page, which fetches the full volume data independently.
 */
export const Author = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['books', 'author', name],
    queryFn: () => api.books.byAuthor(name!),
    enabled: !!name,
  });

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  const libraryStatusMap = useMemo(
    () =>
      new Map(
        (libraryData ?? [])
          .filter((e): e is typeof e & { bookRef: string } => e.bookRef !== null)
          .map((e) => [e.bookRef, e.status])
      ),
    [libraryData]
  );

  const books = data?.results ?? [];

  return (
    <Layout title={name}>
      {isFetching ? (
        <Loader />
      ) : books.length === 0 ? (
        <Text variant="ui-sm" color="muted">
          No books found for this author.
        </Text>
      ) : (
        <BookGrid>
          {books.map((book) => {
            const shelfStatus = libraryStatusMap.get(book.bookRef);
            return (
              <BookCard
                key={book.bookRef}
                title={book.title}
                author={book.authors[0] ?? ''}
                coverUrl={book.largeThumbnail ?? book.thumbnail}
                inLibrary={!!shelfStatus}
                spineLabel={shelfStatus ? STATUS_LABELS[shelfStatus] : undefined}
                onClick={() =>
                  navigate(bookPath(book.bookRef, libraryData), {
                    state: { backLabel: name },
                  })
                }
              />
            );
          })}
        </BookGrid>
      )}
    </Layout>
  );
};
