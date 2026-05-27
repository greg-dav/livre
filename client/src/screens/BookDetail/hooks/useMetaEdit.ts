import { useState, useCallback } from 'react';

/**
 * Manages open state and a draft value for a metadata field dialog. The calling hook composes
 * this and adds field-specific validation and save logic.
 */
export const useMetaEdit = <T>(currentValue: T) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<T>(currentValue);

  const openDialog = useCallback(() => {
    setDraft(currentValue);
    setOpen(true);
  }, [currentValue]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setDraft(currentValue);
      setOpen(next);
    },
    [currentValue]
  );

  return { open, setOpen, draft, setDraft, openDialog, handleOpenChange };
};
