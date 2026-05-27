import { useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

interface UseContentEditableOptions<T extends HTMLElement> {
  ref: RefObject<T | null>;
  getValue: () => string;
  revert: () => void;
  onSave?: (value: string) => void;
  debounceMs?: number;
}

/**
 * Manages the focus tracking, debounced save, and keyboard handling for an always-on contenteditable
 * field. The caller owns DOM initialisation (setting innerHTML/innerText, syncing from props) in a
 * useLayoutEffect — this hook handles everything that happens after the user starts typing.
 *
 * getValue and revert are called via internal refs so they always reflect the latest closure values
 * without needing the caller to memoize them.
 */
export const useContentEditable = <T extends HTMLElement>({
  ref,
  getValue,
  revert,
  onSave,
  debounceMs = 3500,
}: UseContentEditableOptions<T>) => {
  const focused = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest versions of callbacks without requiring callers to memoize.
  const getValueRef = useRef(getValue);
  const revertRef = useRef(revert);
  const onSaveRef = useRef(onSave);
  getValueRef.current = getValue;
  revertRef.current = revert;
  onSaveRef.current = onSave;

  const clearTimer = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  };

  return {
    focused,
    handleFocus: () => {
      focused.current = true;
    },
    handleInput: () => {
      clearTimer();
      saveTimer.current = setTimeout(() => onSaveRef.current?.(getValueRef.current()), debounceMs);
    },
    handleBlur: () => {
      focused.current = false;
      clearTimer();
      onSaveRef.current?.(getValueRef.current());
    },
    handleKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTimer();
        revertRef.current();
        ref.current?.blur();
      }
    },
  };
};
