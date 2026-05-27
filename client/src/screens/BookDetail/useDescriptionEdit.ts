import { useRef, useLayoutEffect } from 'react';
import { useContentEditable } from '../../hooks/useContentEditable';
import { toDescriptionHTML, readDescriptionContent } from './BookDetail.utils';

/**
 * Encapsulates all contenteditable state for the description field: DOM initialisation,
 * focus tracking, debounced save, and Escape-to-revert. Returns a ref to attach to the
 * element and the four event handlers to wire up — the caller needs nothing else.
 */
export const useDescriptionEdit = (
  description: string | undefined,
  onSave: ((description: string) => void) | undefined
) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { focused, handleFocus, handleInput, handleBlur, handleKeyDown } = useContentEditable({
    ref: editorRef,
    getValue: () => readDescriptionContent(editorRef.current!),
    revert: () => {
      if (editorRef.current) editorRef.current.innerHTML = toDescriptionHTML(description ?? '');
    },
    onSave,
  });

  // Sync DOM when the description prop changes (e.g. after a save refetch), but not while
  // the user has focus so in-progress edits aren't clobbered.
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el || focused.current) return;
    el.innerHTML = toDescriptionHTML(description ?? '');
  }, [description]); // eslint-disable-line react-hooks/exhaustive-deps

  return { editorRef, handleFocus, handleInput, handleBlur, handleKeyDown };
};
