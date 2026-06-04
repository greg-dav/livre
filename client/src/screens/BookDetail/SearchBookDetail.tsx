import { useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, Popover, Icon, Loader } from '@livre/primitives';
import { type LogEventType } from '@livre/types';
import { api } from '../../lib/api';
import { pushRecentBook } from '../../lib/recentBooks';
import { Layout } from '../../components';
import { useLibrary } from '../../context/LibraryContext';
import { SELECTABLE_EVENTS } from './utils/BookDetail.utils';
import { BookDetailView } from './components/BookDetailView/BookDetailView';

/**
 * Discovery view for a book not yet in the library. Identified entirely by the opaque
 * `bookRef` from the URL — the client never knows or cares which provider the book is from.
 * If the book is already in the library (detected from the library cache), redirects
 * immediately to the library path. On save, redirects to the library path and triggers the
 * acquisition animation.
 */
export const SearchBookDetail = () => {
  const { bookRef } = useParams<{ bookRef: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { library } = useLibrary();

  const { data: book } = useQuery({
    queryKey: ['books', 'detail', bookRef],
    queryFn: () => api.search.getByRef(bookRef!),
    enabled: !!bookRef,
  });

  useLayoutEffect(() => {
    if (!library || !bookRef) return;
    const entry = library.find((e) => e.bookRef === bookRef);
    if (entry) navigate(`/library/${entry.libraryBookId}`, { replace: true });
  }, [library, bookRef, navigate]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => api.library.add(bookRef!, event),
    onSuccess: async (data) => {
      await queryClient.prefetchQuery({
        queryKey: ['library', 'detail', data.libraryBookId],
        queryFn: () => api.library.book(data.libraryBookId),
      });
      navigate(`/library/${data.libraryBookId}`, { state: { justAcquired: true }, replace: true });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  useEffect(() => {
    if (!book || !bookRef) return;
    pushRecentBook({
      bookRef,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail,
    });
  }, [bookRef, book]);

  if (!book) {
    return (
      <Layout>
        <Loader />
      </Layout>
    );
  }

  return (
    <BookDetailView
      book={book}
      actions={
        <Popover
          side="bottom"
          align="start"
          trigger={
            <Button variant="primary" size="sm" disabled={isSaving}>
              <Text variant="label" color="onColor">
                Add to library
              </Text>
              <Icon icon="chevron-down" size={14} />
            </Button>
          }
        >
          <Popover.Panel>
            {SELECTABLE_EVENTS.map(({ event, label }) => (
              <Popover.Item key={event} onSelect={() => save(event)}>
                <Text className="menu-label" variant="ui-sm">
                  {label}
                </Text>
              </Popover.Item>
            ))}
          </Popover.Panel>
        </Popover>
      }
    />
  );
};
