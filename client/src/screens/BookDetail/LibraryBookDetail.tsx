import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, DropdownMenu, Loader } from '@livre/primitives';
import { type LogEventType } from '@livre/types';
import { api } from '../../lib/api';
import { pushRecentBook } from '../../lib/recentBooks';
import { Layout } from '../../components';
import { ReadingSince, ReadingSinceDot } from './BookDetail.styles';
import { STATUS_LABELS, SELECTABLE_EVENTS, formatReadingSince } from './BookDetail.utils';
import { BookDetailView } from './BookDetailView';
import { navigationStateSchema } from '../../schemas/navigation';

/**
 * Detail view for a book in the user's library. Fetches all data by userBookId in a single
 * request — no googleId needed on the client. Shows library-specific UI: current status in the
 * action button, "Reading since" indicator, and (eventually) the journal sidecar. The acquisition
 * animation fires once when navigated here from the search path.
 */
export const LibraryBookDetail = () => {
  const { userBookId: userBookIdStr } = useParams<{ userBookId: string }>();
  const userBookId = Number(userBookIdStr);
  const location = useLocation();
  const queryClient = useQueryClient();

  const justAcquired = navigationStateSchema.safeParse(location.state).data?.justAcquired ?? false;

  const { data } = useQuery({
    queryKey: ['library', 'detail', userBookId],
    queryFn: () => api.books.libraryBook(userBookId),
    enabled: !!userBookId,
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => api.books.logByUserBookId(userBookId, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', userBookId] });
    },
  });

  useEffect(() => {
    if (!data || !data.entry.googleId) return;
    pushRecentBook({
      googleId: data.entry.googleId,
      title: data.book.title,
      authors: data.book.authors,
      thumbnail: data.book.thumbnail,
    });
  }, [data]);

  if (!data) {
    return (
      <Layout>
        <Loader />
      </Layout>
    );
  }

  const { entry, book } = data;
  const { status: savedStatus, startedDate: readingStartedDate } = entry;

  return (
    <BookDetailView
      book={book}
      inLibrary
      justAcquired={justAcquired}
      actions={
        <DropdownMenu
          trigger={
            <Button variant="primary" size="sm" disabled={isSaving}>
              <Text variant="label" color="onColor">
                {STATUS_LABELS[savedStatus]} ▾
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
      statusIndicator={
        savedStatus === 'reading' && readingStartedDate ? (
          <ReadingSince>
            <ReadingSinceDot />
            <Text variant="ui-sm" color="muted">
              Reading since {formatReadingSince(readingStartedDate)}
            </Text>
          </ReadingSince>
        ) : undefined
      }
    />
  );
};
