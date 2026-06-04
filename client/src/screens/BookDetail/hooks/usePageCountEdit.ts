import { useMetaEdit } from './useMetaEdit';

export const usePageCountEdit = (
  pageCount: number | undefined,
  onSave: ((pageCount: number) => void) | undefined
) => {
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(
    pageCount !== undefined ? String(pageCount) : ''
  );

  const parsed = parseInt(draft, 10);
  const isValid = Number.isInteger(parsed) && parsed > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave?.(parsed);
    handleOpenChange(false);
  };

  return { open, handleOpenChange, openDialog, draft, setDraft, handleSave, isValid };
};
