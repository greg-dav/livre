import { useMetaEdit } from './useMetaEdit';

// MM/DD/YYYY
const DISPLAY_RE = /^\d{2}\/\d{2}\/\d{4}$/;

/** Converts stored YYYY-MM-DD to display MM/DD/YYYY. Partial dates start blank. */
const storedToDisplay = (stored: string): string => {
  const parts = stored.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return '';
};

/** Converts display MM/DD/YYYY back to stored YYYY-MM-DD. */
const displayToStored = (display: string): string => {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : '';
};

const applyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const useDateEdit = (
  publishedDate: string | undefined,
  onSave: ((publishedDate: string) => void) | undefined
) => {
  const initial = storedToDisplay(publishedDate ?? '');
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(initial);

  const isValid = DISPLAY_RE.test(draft);

  const handleSave = () => {
    const stored = displayToStored(draft);
    if (stored) onSave?.(stored);
  };

  const handleChange = (raw: string) => {
    setDraft(applyMask(raw));
  };

  return { open, handleOpenChange, openDialog, draft, handleChange, handleSave, isValid };
};
