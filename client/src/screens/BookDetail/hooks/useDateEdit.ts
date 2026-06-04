import { useMetaEdit } from './useMetaEdit';
import {
  DATE_DISPLAY_RE,
  storedToDisplay,
  displayToStored,
  applyDateMask,
} from '../../../lib/dateInput';

export const useDateEdit = (
  publishedDate: string | undefined,
  onSave: ((publishedDate: string) => void) | undefined
) => {
  const initial = storedToDisplay(publishedDate ?? '');
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(initial);

  const isValid = DATE_DISPLAY_RE.test(draft);

  const handleSave = () => {
    const stored = displayToStored(draft);
    if (!stored) return;
    onSave?.(stored);
    handleOpenChange(false);
  };

  const handleChange = (raw: string) => {
    setDraft(applyDateMask(raw));
  };

  return { open, handleOpenChange, openDialog, draft, handleChange, handleSave, isValid };
};
