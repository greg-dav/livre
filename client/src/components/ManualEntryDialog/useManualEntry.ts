import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { type ShelfStatus } from '@livre/types';
import { api } from '../../lib/api';

/**
 * Form state and submit logic for manual book entry, kept out of the view so ManualEntryDialog only
 * wires the returned values to JSX. Fields reset whenever the dialog opens (seeded with an optional
 * title), so reopening never shows a stale draft. On success the new book is prefetched and the
 * library/shelf/log caches are invalidated, then we navigate to its detail page with the same
 * `justAcquired` flag the search-to-library flow uses, so a manual add feels identical to a found one.
 */
export const useManualEntry = (
  open: boolean,
  seedTitle: string | undefined,
  onClose: () => void
) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [status, setStatus] = useState<ShelfStatus>('read');
  const [showMore, setShowMore] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [isbn, setIsbn] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(seedTitle?.trim() ?? '');
    setAuthors('');
    setStatus('read');
    setShowMore(false);
    setCoverUrl('');
    setIsbn('');
    setPageCount('');
    setPublisher('');
    setPublishedDate('');
    setDescription('');
  }, [open, seedTitle]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => {
      const pages = Number.parseInt(pageCount, 10);
      return api.library.createManual({
        title: title.trim(),
        authors: authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        coverUrl: coverUrl.trim() || undefined,
        isbn: isbn.trim() || undefined,
        pageCount: Number.isFinite(pages) && pages > 0 ? pages : undefined,
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        description: description.trim() || undefined,
        status,
      });
    },
    onSuccess: async (data) => {
      await queryClient.prefetchQuery({
        queryKey: ['library', 'detail', data.libraryBookId],
        queryFn: () => api.library.book(data.libraryBookId),
      });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['log'] });
      onClose();
      navigate(`/library/${data.libraryBookId}`, { state: { justAcquired: true } });
    },
  });

  return {
    title,
    setTitle,
    authors,
    setAuthors,
    status,
    setStatus,
    showMore,
    setShowMore,
    coverUrl,
    setCoverUrl,
    isbn,
    setIsbn,
    pageCount,
    setPageCount,
    publisher,
    setPublisher,
    publishedDate,
    setPublishedDate,
    description,
    setDescription,
    isValid: title.trim().length > 0,
    isPending,
    error,
    submit: () => mutate(),
  };
};
