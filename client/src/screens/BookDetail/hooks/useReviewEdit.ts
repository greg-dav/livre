import { useRef, useLayoutEffect } from 'react';
import { useContentEditable } from '../../../hooks/useContentEditable';

/**
 * Encapsulates contenteditable state for the review field. Plain-text only — no HTML. Uses the
 * same debounced-save / Escape-to-revert pattern as useDescriptionEdit but strips all markup
 * so review content stays portable and diffable.
 */
export const useReviewEdit = (
  review: string | undefined,
  onSave: ((review: string) => void) | undefined
) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // useContentEditable's sync effect fires on value changes, not on element mount.
  // ReviewEditor is conditionally rendered (focus mode only), so we must initialize
  // the DOM explicitly when the ref first becomes non-null.
  const lastInitEl = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el || el === lastInitEl.current) return;
    lastInitEl.current = el;
    el.textContent = review ?? '';
  });

  const { handleFocus, handleInput, handleBlur, handleKeyDown } = useContentEditable({
    ref: editorRef,
    getValue: () => editorRef.current?.textContent ?? '',
    onSave,
    sync: {
      value: review,
      update: (el, v) => {
        el.textContent = v ?? '';
      },
    },
  });

  return { editorRef, handleFocus, handleInput, handleBlur, handleKeyDown };
};
