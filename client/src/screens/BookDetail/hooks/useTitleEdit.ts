import { useRef } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { useContentEditable } from '../../../hooks/useContentEditable';

/**
 * Encapsulates all contenteditable state for the title field: DOM init, focus tracking,
 * debounced save, and keyboard handling. Single-line — Enter commits and blurs rather than
 * inserting a newline; paste strips newlines before insertion.
 */
export const useTitleEdit = (
  title: string | undefined,
  onSave: ((title: string) => void) | undefined
) => {
  const editorRef = useRef<HTMLSpanElement>(null);
  const {
    handleFocus,
    handleInput,
    handleBlur,
    handleKeyDown: baseKeyDown,
  } = useContentEditable({
    ref: editorRef,
    getValue: () => editorRef.current?.innerText.trim() ?? '',
    onSave,
    sync: {
      value: title,
      update: (el, v) => {
        el.innerText = v;
      },
    },
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorRef.current?.blur();
      return;
    }
    baseKeyDown(e);
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData
      .getData('text/plain')
      .replace(/[\n\r]+/g, ' ')
      .trim();
    document.execCommand('insertText', false, text);
  };

  return { editorRef, handleFocus, handleInput, handleBlur, handleKeyDown, handlePaste };
};
