import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text, BookCard, BookGrid, Loader } from '@livre/primitives';
import { searchSortSchema, type SearchSort } from '@livre/types';
import { api } from '../../lib/api';
import { dedupeByRef, SORT_LABELS, STATUS_LABELS } from '../../lib/search';
import { Layout, SortMenu, LoadMore } from '../../components';
import { Toolbar, HeadLine, Results } from './Author.styles';

/**
 * All books by a single author — the same faceted, paginated, library-annotated result set as the
 * Search screen, pre-scoped to one author and reached from a book's detail page. Sort is local to
 * this exploration (not part of the global search session); each card routes to the owned copy when
 * the user already has it, otherwise to the discovery view.
 */
export const Author = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SearchSort>('relevance');

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['books', 'author', name, sort],
    queryFn: ({ pageParam }) => api.search.byAuthor(name ?? '', { sort, startIndex: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextStartIndex ?? undefined,
    enabled: !!name,
    staleTime: 60_000,
  });

  const books = dedupeByRef(data?.pages.flatMap((page) => page.results) ?? []);
  const count = books.length;

  return (
    <Layout title={name}>
      <Toolbar>
        <HeadLine>
          <Text variant="ui-sm" color="muted">
            {count} {count === 1 ? 'book' : 'books'}
          </Text>
        </HeadLine>
        {count > 0 && (
          <SortMenu
            value={sort}
            onChange={setSort}
            options={searchSortSchema.options}
            labels={SORT_LABELS}
          />
        )}
      </Toolbar>

      {isLoading ? (
        <Loader />
      ) : count === 0 ? (
        <Text variant="ui-sm" color="muted">
          No books found for this author.
        </Text>
      ) : (
        <Results>
          <BookGrid>
            {books.map((book) => (
              <BookCard
                key={book.bookRef}
                title={book.title}
                author={book.authors[0] ?? ''}
                coverUrl={book.largeThumbnail ?? book.thumbnail}
                inLibrary={book.libraryStatus !== null}
                spineLabel={book.libraryStatus ? STATUS_LABELS[book.libraryStatus] : undefined}
                onClick={() =>
                  navigate(
                    book.libraryBookId !== null
                      ? `/library/${book.libraryBookId}`
                      : `/search/book/${encodeURIComponent(book.bookRef)}`,
                    { state: { backLabel: name } }
                  )
                }
              />
            ))}
          </BookGrid>
          {hasNextPage && <LoadMore onClick={() => fetchNextPage()} loading={isFetchingNextPage} />}
        </Results>
      )}
    </Layout>
  );
};
