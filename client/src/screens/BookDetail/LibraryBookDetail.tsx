import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, DropdownMenu, Loader } from '@livre/primitives';
import { type LogEventType, type RefreshMetadataBody, type BookFormat } from '@livre/types';
import { api } from '../../lib/api';
import { pushRecentBook } from '../../lib/recentBooks';
import { Layout } from '../../components';
import { ReadingSince, ReadingSinceDot } from './components/BookDetailView/BookDetailView.styles';
import { STATUS_LABELS, SELECTABLE_EVENTS, formatReadingSince } from './utils/BookDetail.utils';
import { parseDateLocal } from '../../lib/dateInput';
import { BookDetailView } from './components/BookDetailView/BookDetailView';
import { Journal } from './components/Journal/Journal';
import { navigationStateSchema } from '../../schemas/navigation';

/**
 * Detail view for a book in the user's library. Fetches all data by libraryBookId in a single
 * request — the opaque bookRef is returned in the payload (so we can record it as a recent
 * book) but is otherwise unused by the client. Shows library-specific UI: current status in
 * the action button, "Reading since" indicator, and (eventually) the journal sidecar. The
 * acquisition animation fires once when navigated here from the search path.
 */
export const LibraryBookDetail = () => {
  const { libraryBookId: libraryBookIdStr } = useParams<{ libraryBookId: string }>();
  const libraryBookId = Number(libraryBookIdStr);
  const location = useLocation();
  const queryClient = useQueryClient();

  const justAcquired = navigationStateSchema.safeParse(location.state).data?.justAcquired ?? false;
  const [focusMode, setFocusMode] = useState(false);
  const onToggleFocus = () => setFocusMode((f) => !f);

  const { data } = useQuery({
    queryKey: ['library', 'detail', libraryBookId],
    queryFn: () => api.books.libraryBook(libraryBookId),
    enabled: !!libraryBookId,
  });

  const { data: tagSuggestions } = useQuery({
    queryKey: ['library', 'tags'],
    queryFn: () => api.books.libraryTags(),
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => api.books.logByLibraryBookId(libraryBookId, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      // Warm the reading shelf in the background so Library's sidebar is already correct on mount.
      // invalidateQueries above marks it stale, so prefetchQuery sees a miss and fetches immediately.
      queryClient.prefetchQuery({
        queryKey: ['shelves', 'reading'],
        queryFn: () => api.shelves.getByStatus('reading'),
      });
    },
  });

  const { mutate: saveTags } = useMutation({
    mutationFn: (tags: string[]) => api.books.updateTags(libraryBookId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['library', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveTitle } = useMutation({
    mutationFn: (title: string) => api.books.updateTitle(libraryBookId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveDescription } = useMutation({
    mutationFn: (description: string) => api.books.updateDescription(libraryBookId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
    },
  });

  const { mutate: saveCover } = useMutation({
    mutationFn: (url: string) => api.books.updateCover(libraryBookId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const invalidateDetail = () =>
    queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });

  const { mutate: savePublisher } = useMutation({
    mutationFn: (publisher: string) => api.books.updatePublisher(libraryBookId, publisher),
    onSuccess: invalidateDetail,
  });

  const { mutate: savePageCount } = useMutation({
    mutationFn: (pageCount: number) => api.books.updatePageCount(libraryBookId, pageCount),
    onSuccess: invalidateDetail,
  });

  const { mutate: savePublishedDate } = useMutation({
    mutationFn: (publishedDate: string) =>
      api.books.updatePublishedDate(libraryBookId, publishedDate),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveLanguage } = useMutation({
    mutationFn: (language: string) => api.books.updateLanguage(libraryBookId, language),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveIsbn } = useMutation({
    mutationFn: (isbn: string) => api.books.updateIsbn(libraryBookId, isbn),
    onSuccess: invalidateDetail,
  });

  const { mutate: refreshMetadata } = useMutation({
    mutationFn: (fields: RefreshMetadataBody) => api.books.refreshMetadata(libraryBookId, fields),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveRating } = useMutation({
    mutationFn: (rating: number) => api.books.updateRating(libraryBookId, rating || null),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveReview } = useMutation({
    mutationFn: (review: string) => api.books.updateReview(libraryBookId, review),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveFormat } = useMutation({
    mutationFn: (format: BookFormat) => api.books.logFormatChange(libraryBookId, format),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const addNote = (text: string, type: 'note' | 'quote') => {
    api.books.logByLibraryBookId(libraryBookId, type, undefined, text).then(invalidateDetail);
  };

  const { mutate: updateLogEntry } = useMutation({
    mutationFn: ({ logId, fields }: { logId: number; fields: { text?: string; date?: string } }) =>
      api.books.updateLogEntry(libraryBookId, logId, fields),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: deleteLogEntry } = useMutation({
    mutationFn: (logId: number) => api.books.deleteLogEntry(libraryBookId, logId),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  useEffect(() => {
    if (!data || !data.entry.bookRef) return;
    pushRecentBook({
      bookRef: data.entry.bookRef,
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

  // Most recent format event in the log (log is desc-sorted so first match = current)
  const currentFormatEntry = data.log.find((e) => e.event === 'format');
  const currentFormat =
    currentFormatEntry && currentFormatEntry.event === 'format' ? currentFormatEntry.format : null;

  const formatStatusDate = (iso: string) =>
    parseDateLocal(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const statusEventDate = (() => {
    const target =
      savedStatus === 'read'
        ? 'finished'
        : savedStatus === 'want'
          ? 'shelved'
          : savedStatus === 'dnf'
            ? 'dnf'
            : null;
    return target ? data.log.find((e) => e.event === target)?.date : null;
  })();

  const focusStripMeta =
    savedStatus === 'reading' && readingStartedDate
      ? `Reading since ${formatReadingSince(readingStartedDate)}`
      : savedStatus === 'read' && statusEventDate
        ? `Finished ${formatStatusDate(statusEventDate)}`
        : savedStatus === 'want' && statusEventDate
          ? `Shelved ${formatStatusDate(statusEventDate)}`
          : savedStatus === 'dnf' && statusEventDate
            ? `Did not finish ${formatStatusDate(statusEventDate)}`
            : null;

  return (
    <BookDetailView
      book={book}
      inLibrary
      editable
      justAcquired={justAcquired}
      focusMode={focusMode}
      onExitFocus={onToggleFocus}
      focusStripMeta={focusStripMeta}
      currentFormat={currentFormat}
      onFormatChange={saveFormat}
      onTagsChange={saveTags}
      tagSuggestions={tagSuggestions}
      onTitleChange={saveTitle}
      onDescriptionChange={saveDescription}
      onCoverChange={saveCover}
      onPublisherChange={savePublisher}
      onPageCountChange={savePageCount}
      onPublishedDateChange={savePublishedDate}
      onLanguageChange={saveLanguage}
      onIsbnChange={saveIsbn}
      onRefreshMetadata={refreshMetadata}
      journal={
        <Journal
          entry={entry}
          log={data.log}
          justAcquired={justAcquired}
          focusMode={focusMode}
          onToggleFocus={onToggleFocus}
          onRatingChange={saveRating}
          onReviewChange={saveReview}
          onNoteAdd={addNote}
          onLogEntryUpdate={(logId, fields) => updateLogEntry({ logId, fields })}
          onLogEntryDelete={(logId) => deleteLogEntry(logId)}
        />
      }
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
