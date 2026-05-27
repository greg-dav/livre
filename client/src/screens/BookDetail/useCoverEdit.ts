import { useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';

/**
 * Encapsulates all state and event handlers for the cover-change dialog: open/close, URL input,
 * stopPropagation on the button click (so the Lightbox beneath doesn't also fire), and the save
 * flow. Returns only what the caller needs to wire up the overlay button and dialog.
 */
export const useCoverEdit = (onSave: ((url: string) => void) | undefined) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  return {
    open,
    url,
    setUrl,
    openDialog: (e: MouseEvent) => {
      e.stopPropagation();
      setUrl('');
      setOpen(true);
    },
    handleOpenChange: (nextOpen: boolean) => {
      if (!nextOpen) setUrl('');
      setOpen(nextOpen);
    },
    handleSave: (e: FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;
      onSave?.(trimmed);
      setOpen(false);
    },
  };
};
