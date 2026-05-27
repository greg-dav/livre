import { useRef, useLayoutEffect } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

interface UseContentEditableOptions<T extends HTMLElement> {
  ref: RefObject<T | null>;
  getValue: () => string;
  /** Called on Escape to restore the previous DOM state. Derived from sync.update when omitted. */
  revert?: () => void;
  onSave?: (value: string) => void;
  debounceMs?: number;
  /**
   * When provided, syncs the DOM whenever value changes while the field is unfocused — the same
   * guard that prevents clobbering in-progress edits. Also supplies the default revert behaviour
   * when revert is omitted.
   */
  sync?: { value: string | undefined; update: (el: T, value: string) => void };
}

/**
 * Manages focus tracking, debounced save, DOM sync, and keyboard handling for an always-on
 * contenteditable field. Callers supply getValue, and optionally sync + revert to describe the
 * field's serialization — this hook handles everything that happens after the user starts typing.
 *
 * getValue, revert, and sync.update are called via internal refs so they always reflect the
 * latest closure values without needing the caller to memoize them.
 */
export const useContentEditable = <T extends HTMLElement>({
  ref,
  getValue,
  revert,
  onSave,
  debounceMs = 3500,
  sync,
}: UseContentEditableOptions<T>) => {
  const focused = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest versions of callbacks without requiring callers to memoize.
  const getValueRef = useRef(getValue);
  const revertRef = useRef(revert);
  const onSaveRef = useRef(onSave);
  const syncRef = useRef(sync);
  getValueRef.current = getValue;
  revertRef.current = revert;
  onSaveRef.current = onSave;
  syncRef.current = sync;

  const effectiveRevert = () => {
    if (revertRef.current) {
      revertRef.current();
    } else {
      const el = ref.current;
      const s = syncRef.current;
      if (el && s) s.update(el, s.value ?? '');
    }
  };

  useLayoutEffect(() => {
    const el = ref.current;
    const s = syncRef.current;
    if (!el || focused.current || !s) return;
    s.update(el, s.value ?? '');
  }, [sync?.value]); // eslint-disable-line react-hooks/exhaustive-deps

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
        effectiveRevert();
        ref.current?.blur();
      }
    },
  };
};
