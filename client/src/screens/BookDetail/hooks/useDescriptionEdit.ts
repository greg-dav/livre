import { useRef } from 'react';
import { useContentEditable } from '../../../hooks/useContentEditable';
import { toDescriptionHTML, readDescriptionContent } from '../utils/BookDetail.utils';

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
  const { handleFocus, handleInput, handleBlur, handleKeyDown } = useContentEditable({
    ref: editorRef,
    getValue: () => readDescriptionContent(editorRef.current!),
    onSave,
    sync: {
      value: description,
      update: (el, v) => {
        el.innerHTML = toDescriptionHTML(v);
      },
    },
  });

  return { editorRef, handleFocus, handleInput, handleBlur, handleKeyDown };
};
