import { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardEvent } from 'react';

interface UseInlineEditOptions {
  initialValue: string;
  onSave?: (value: string) => void;
  debounceMs?: number;
}

/**
 * Shared state and handlers for the double-click-to-edit pattern used across book detail fields
 * (description, title, etc.). Manages editing mode, local value sync, debounced save, and
 * Escape-to-cancel. DOM initialization (setting innerText/innerHTML, placing the cursor) is left
 * to the caller in a useLayoutEffect so each field can own its own markup strategy.
 */
export const useInlineEdit = ({
  initialValue,
  onSave,
  debounceMs = 3500,
}: UseInlineEditOptions) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from prop when not editing (e.g. after query refetch succeeds).
  useEffect(() => {
    if (!editing) setLocalValue(initialValue);
  }, [initialValue, editing]);

  const clearTimer = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  };

  const enterEditMode = useCallback(() => {
    if (!onSave) return;
    setEditing(true);
  }, [onSave]);

  const scheduleDebounce = useCallback(
    (value: string) => {
      clearTimer();
      saveTimer.current = setTimeout(() => onSave?.(value), debounceMs);
    },
    [onSave, debounceMs]
  );

  const commit = useCallback(
    (value: string) => {
      clearTimer();
      setLocalValue(value);
      onSave?.(value);
      setEditing(false);
    },
    [onSave]
  );

  const cancel = useCallback(() => {
    clearTimer();
    setEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    },
    [cancel]
  );

  return { editing, localValue, enterEditMode, scheduleDebounce, commit, cancel, handleKeyDown };
};
