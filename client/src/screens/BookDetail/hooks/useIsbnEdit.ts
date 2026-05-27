import { useState, useCallback } from 'react';
import { useMetaEdit } from './useMetaEdit';
import { api } from '../../../lib/api';
import type { BookVolume, RefreshMetadataBody } from '@livre/types';

type Phase = 'enter' | 'looking' | 'found' | 'not-found';

const stripIsbn = (raw: string) => raw.replace(/[^0-9Xx]/g, '').toUpperCase();

const validateIsbn = (raw: string): boolean => {
  const digits = stripIsbn(raw);
  if (digits.length === 13) {
    const sum = digits
      .split('')
      .reduce((acc, ch, i) => acc + parseInt(ch, 10) * (i % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }
  if (digits.length === 10) {
    const sum = digits
      .split('')
      .reduce((acc, ch, i) => acc + (ch === 'X' ? 10 : parseInt(ch, 10)) * (10 - i), 0);
    return sum % 11 === 0;
  }
  return false;
};

export const useIsbnEdit = (
  isbn: string | undefined,
  onSave: ((isbn: string) => void) | undefined,
  onRefreshMetadata: ((fields: RefreshMetadataBody) => void) | undefined
) => {
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(isbn ?? '');
  const [phase, setPhase] = useState<Phase>('enter');
  const [foundBook, setFoundBook] = useState<BookVolume | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const digits = stripIsbn(draft);
  const isValidFormat = validateIsbn(draft);

  const handleOpenChangeWrapped = useCallback(
    (next: boolean) => {
      handleOpenChange(next);
      if (!next) {
        setPhase('enter');
        setFoundBook(null);
        setLookupError(null);
      }
    },
    [handleOpenChange]
  );

  const handleLookup = useCallback(async () => {
    setPhase('looking');
    setLookupError(null);
    try {
      const result = await api.books.search(`isbn:${digits}`);
      if (result.results.length > 0) {
        setFoundBook(result.results[0]);
        setPhase('found');
      } else {
        setFoundBook(null);
        setPhase('not-found');
      }
    } catch {
      setLookupError('Lookup failed. Check your connection and try again.');
      setPhase('enter');
    }
  }, [digits]);

  const handleSaveIsbnOnly = useCallback(() => {
    onSave?.(digits);
    handleOpenChangeWrapped(false);
  }, [digits, onSave, handleOpenChangeWrapped]);

  const handleSaveWithMetadata = useCallback(() => {
    if (!foundBook) return;
    const fields: RefreshMetadataBody = {
      title: foundBook.title,
      authors: foundBook.authors,
      description: foundBook.description,
      thumbnail: foundBook.thumbnail,
      largeThumbnail: foundBook.largeThumbnail,
      isbn: digits,
      pageCount: foundBook.pageCount,
      publisher: foundBook.publisher,
      publishedDate: foundBook.publishedDate,
      language: foundBook.language,
    };
    onRefreshMetadata?.(fields);
    handleOpenChangeWrapped(false);
  }, [foundBook, digits, onRefreshMetadata, handleOpenChangeWrapped]);

  return {
    open,
    openDialog,
    handleOpenChange: handleOpenChangeWrapped,
    draft,
    setDraft,
    phase,
    foundBook,
    lookupError,
    isValidFormat,
    handleLookup,
    handleSaveIsbnOnly,
    handleSaveWithMetadata,
  };
};
