import { useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, DropdownMenu, Loader } from '@livre/primitives';
import { type LogEventType } from '@livre/types';
import { api } from '../../lib/api';
import { pushRecentBook } from '../../lib/recentBooks';
import { Layout } from '../../components';
import { SELECTABLE_EVENTS } from './BookDetail.utils';
import { BookDetailView } from './BookDetailView';

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

  const { data: book } = useQuery({
    queryKey: ['books', 'detail', bookRef],
    queryFn: () => api.books.getByRef(bookRef!),
    enabled: !!bookRef,
  });

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  useLayoutEffect(() => {
    if (!libraryData || !bookRef) return;
    const entry = libraryData.find((e) => e.bookRef === bookRef);
    if (entry) navigate(`/library/${entry.libraryBookId}`, { replace: true });
  }, [libraryData, bookRef, navigate]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => api.books.addToLibrary(bookRef!, event),
    onSuccess: async (data) => {
      await queryClient.prefetchQuery({
        queryKey: ['library', 'detail', data.libraryBookId],
        queryFn: () => api.books.libraryBook(data.libraryBookId),
      });
      navigate(`/library/${data.libraryBookId}`, { state: { justAcquired: true } });
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
        <DropdownMenu
          trigger={
            <Button variant="primary" size="sm" disabled={isSaving}>
              <Text variant="label" color="onColor">
                Add to library ▾
              </Text>
            </Button>
          }
        >
          {SELECTABLE_EVENTS.map(({ event, label }) => (
            <DropdownMenu.Item key={event} onSelect={() => save(event)}>
              <Text variant="ui-sm">{label}</Text>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu>
      }
    />
  );
};
