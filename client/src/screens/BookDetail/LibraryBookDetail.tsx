import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, Popover, Dialog, Icon, Loader } from '@livre/primitives';
import { type LogEventType, type UpdateMetadataBody, type BookFormat } from '@livre/types';
import { api } from '../../lib/api';
import { pushRecentBook } from '../../lib/recentBooks';
import { Layout } from '../../components';
import { ReadingSince, ReadingSinceDot } from './components/BookDetailView/BookDetailView.styles';
import { STATUS_LABELS, SELECTABLE_EVENTS, formatReadingSince } from './utils/BookDetail.utils';
import { parseDateLocal } from '../../lib/dateInput';
import { BookDetailView } from './components/BookDetailView/BookDetailView';
import { Journal } from './components/Journal/Journal';
import { DialogActions } from './LibraryBookDetail.styles';
import { navigationStateSchema } from '../../schemas/navigation';

type ConfirmKey = 'reset' | 'remove';

const CONFIRM_COPY: Record<
  ConfirmKey,
  { title: string; description: string; confirmLabel: string }
> = {
  reset: {
    title: 'Reset reading log?',
    description:
      "This permanently clears every reading session, note, and quote, along with your rating and review, and returns the book to Want to Read. Your tags and edited details are kept. This can't be undone.",
    confirmLabel: 'Reset',
  },
  remove: {
    title: 'Remove from library?',
    description:
      "This permanently deletes the book and its entire reading history from your library. This can't be undone.",
    confirmLabel: 'Remove',
  },
};

// The selectable status event that corresponds to each saved shelf status — drives the active
// highlight in the status menu.
const STATUS_EVENT: Record<string, LogEventType> = {
  want: 'shelved',
  reading: 'started',
  read: 'finished',
  dnf: 'dnf',
};

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const justAcquired = navigationStateSchema.safeParse(location.state).data?.justAcquired ?? false;
  const [focusMode, setFocusMode] = useState(false);
  const [confirming, setConfirming] = useState<ConfirmKey | null>(null);
  const onToggleFocus = () => setFocusMode((f) => !f);

  const { data } = useQuery({
    queryKey: ['library', 'detail', libraryBookId],
    queryFn: () => api.library.book(libraryBookId),
    enabled: !!libraryBookId,
  });

  const { data: tagSuggestions } = useQuery({
    queryKey: ['library', 'tags'],
    queryFn: () => api.library.tags(),
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (event: LogEventType) => api.library.log(libraryBookId, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      // Warm the reading shelf in the background so Library's sidebar is already correct on mount.
      // invalidateQueries above marks it stale, so prefetchQuery sees a miss and fetches immediately.
      queryClient.prefetchQuery({
        queryKey: ['shelves', 'reading'],
        queryFn: () => api.library.shelf('reading'),
      });
    },
  });

  const { mutate: saveTags } = useMutation({
    mutationFn: (tags: string[]) => api.library.updateTags(libraryBookId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['library', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveTitle } = useMutation({
    mutationFn: (title: string) => api.library.updateMetadata(libraryBookId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveAuthors } = useMutation({
    mutationFn: (authors: string[]) => api.library.updateMetadata(libraryBookId, { authors }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveDescription } = useMutation({
    mutationFn: (description: string) => api.library.updateMetadata(libraryBookId, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
    },
  });

  const { mutate: saveCover } = useMutation({
    mutationFn: (url: string) =>
      api.library.updateMetadata(libraryBookId, { thumbnail: url, largeThumbnail: url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const invalidateDetail = () =>
    queryClient.invalidateQueries({ queryKey: ['library', 'detail', libraryBookId] });

  const { mutate: savePublisher } = useMutation({
    mutationFn: (publisher: string) => api.library.updateMetadata(libraryBookId, { publisher }),
    onSuccess: invalidateDetail,
  });

  const { mutate: savePageCount } = useMutation({
    mutationFn: (pageCount: number) => api.library.updateMetadata(libraryBookId, { pageCount }),
    onSuccess: invalidateDetail,
  });

  const { mutate: savePublishedDate } = useMutation({
    mutationFn: (publishedDate: string) =>
      api.library.updateMetadata(libraryBookId, { publishedDate }),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveLanguage } = useMutation({
    mutationFn: (language: string) => api.library.updateMetadata(libraryBookId, { language }),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveIsbn } = useMutation({
    mutationFn: (isbn: string) => api.library.updateMetadata(libraryBookId, { isbn }),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveMetadata } = useMutation({
    mutationFn: (fields: UpdateMetadataBody) => api.library.updateMetadata(libraryBookId, fields),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveRating } = useMutation({
    mutationFn: (rating: number) => api.library.updateRating(libraryBookId, rating || null),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: saveReview } = useMutation({
    mutationFn: (review: string) => api.library.updateReview(libraryBookId, review),
    onSuccess: invalidateDetail,
  });

  const { mutate: saveFormat } = useMutation({
    mutationFn: (format: BookFormat) => api.library.logFormatChange(libraryBookId, format),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const addNote = (text: string, type: 'note' | 'quote') => {
    api.library.log(libraryBookId, type, undefined, text).then(invalidateDetail);
  };

  const { mutate: updateLogEntry } = useMutation({
    mutationFn: ({ logId, fields }: { logId: number; fields: { text?: string; date?: string } }) =>
      api.library.updateLogEntry(libraryBookId, logId, fields),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: deleteLogEntry } = useMutation({
    mutationFn: (logId: number) => api.library.deleteLogEntry(libraryBookId, logId),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: resetReadingLog, isPending: isResetting } = useMutation({
    mutationFn: () => api.library.resetReadingLog(libraryBookId),
    onSuccess: () => {
      setConfirming(null);
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });

  const { mutate: removeFromLibrary, isPending: isRemoving } = useMutation({
    mutationFn: () => api.library.removeFromLibrary(libraryBookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['library', 'tags'] });
      navigate('/library');
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

  const confirmHandlers: Record<ConfirmKey, { run: () => void; isPending: boolean }> = {
    reset: { run: () => resetReadingLog(), isPending: isResetting },
    remove: { run: () => removeFromLibrary(), isPending: isRemoving },
  };
  const activeConfirm = confirming
    ? { ...CONFIRM_COPY[confirming], ...confirmHandlers[confirming] }
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
      onAuthorsChange={saveAuthors}
      onDescriptionChange={saveDescription}
      onCoverChange={saveCover}
      onPublisherChange={savePublisher}
      onPageCountChange={savePageCount}
      onPublishedDateChange={savePublishedDate}
      onLanguageChange={saveLanguage}
      onIsbnChange={saveIsbn}
      onMetadataChange={saveMetadata}
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
        <>
          <Popover
            side="bottom"
            align="start"
            trigger={
              <Button variant="primary" size="sm" disabled={isSaving}>
                <Text variant="label" color="onColor">
                  {STATUS_LABELS[savedStatus]}
                </Text>
                <Icon icon="chevron-down" size={14} />
              </Button>
            }
          >
            <Popover.Panel>
              {SELECTABLE_EVENTS.map(({ event, label }) => (
                <Popover.Item
                  key={event}
                  active={STATUS_EVENT[savedStatus] === event}
                  onSelect={() => save(event)}
                >
                  <Text className="menu-label" variant="ui-sm">
                    {label}
                  </Text>
                </Popover.Item>
              ))}
            </Popover.Panel>
          </Popover>
          <Popover
            side="bottom"
            align="end"
            trigger={
              <Button variant="secondary" size="sm" aria-label="More actions">
                <Text variant="label">⋯</Text>
              </Button>
            }
          >
            <Popover.Panel>
              <Popover.Item onSelect={() => setConfirming('reset')}>
                <Text className="menu-label" variant="ui-sm">
                  Reset reading log
                </Text>
              </Popover.Item>
              <Popover.Item onSelect={() => setConfirming('remove')}>
                <Text className="menu-label" variant="ui-sm">
                  Remove from library
                </Text>
              </Popover.Item>
            </Popover.Panel>
          </Popover>
          <Dialog
            open={confirming !== null}
            onOpenChange={(open) => !open && setConfirming(null)}
            title={activeConfirm?.title ?? ''}
            description={activeConfirm?.description}
          >
            <DialogActions>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" type="button">
                  <Text variant="label">Cancel</Text>
                </Button>
              </Dialog.Close>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={activeConfirm?.isPending}
                onClick={() => activeConfirm?.run()}
              >
                <Text variant="label" color="onColor">
                  {activeConfirm?.confirmLabel}
                </Text>
              </Button>
            </DialogActions>
          </Dialog>
        </>
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
