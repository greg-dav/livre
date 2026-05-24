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
 * Discovery view for a book not yet in the library. Fetches full volume data by Google Books ID.
 * If the book is already in the library (detected from the library cache), redirects immediately
 * to the library path. On save, redirects to the library path and triggers the acquisition
 * animation.
 */
export const SearchBookDetail = () => {
  const { googleId } = useParams<{ googleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: book } = useQuery({
    queryKey: ['books', 'detail', googleId],
    queryFn: () => api.books.getById(googleId!),
    enabled: !!googleId,
  });

  const { data: libraryData } = useQuery({
    queryKey: ['library'],
    queryFn: () => api.books.library(),
    staleTime: Infinity,
  });

  useLayoutEffect(() => {
    if (!libraryData || !googleId) return;
    const entry = libraryData.find((e) => e.googleId === googleId);
    if (entry) navigate(`/library/${entry.userBookId}`, { replace: true });
  }, [libraryData, googleId, navigate]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => api.books.addToLibrary(googleId!, event),
    onSuccess: async (data) => {
      await queryClient.prefetchQuery({
        queryKey: ['library', 'detail', data.userBookId],
        queryFn: () => api.books.libraryBook(data.userBookId),
      });
      navigate(`/library/${data.userBookId}`, { state: { justAcquired: true } });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  useEffect(() => {
    if (!book) return;
    pushRecentBook({
      googleId: googleId!,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail,
    });
  }, [googleId, book]);

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
