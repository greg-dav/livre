import { useMetaEdit } from './useMetaEdit';

// Accepts YYYY, YYYY-MM, or YYYY-MM-DD.
const DATE_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export const useDateEdit = (
  publishedDate: string | undefined,
  onSave: ((publishedDate: string) => void) | undefined
) => {
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(publishedDate ?? '');

  const isValid = DATE_RE.test(draft.trim());

  const handleSave = () => {
    if (isValid) onSave?.(draft.trim());
  };

  /**
   * Restricts input to digits and hyphens, auto-inserts hyphens at positions 5 and 8 when the
   * user types forward (not when backspacing over a hyphen). This gives natural YYYY-MM-DD
   * entry without a third-party mask library.
   */
  const handleChange = (raw: string) => {
    const prev = draft;
    // Strip everything except digits and hyphens.
    let value = raw.replace(/[^0-9-]/g, '');
    // Auto-insert hyphens when typing forward past position 4 or 7.
    if (value.length > prev.length) {
      if (value.length === 5 && !value.includes('-')) value = value.slice(0, 4) + '-' + value[4];
      if (value.length === 8 && value.split('-').length === 2) {
        value = value.slice(0, 7) + '-' + value[7];
      }
    }
    setDraft(value.slice(0, 10));
  };

  return { open, handleOpenChange, openDialog, draft, handleChange, handleSave, isValid };
};
