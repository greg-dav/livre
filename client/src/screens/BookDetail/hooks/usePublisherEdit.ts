import { useMetaEdit } from './useMetaEdit';

export const usePublisherEdit = (
  publisher: string | undefined,
  onSave: ((publisher: string) => void) | undefined
) => {
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(publisher ?? '');

  const handleSave = () => {
    onSave?.(draft.trim());
  };

  return {
    open,
    handleOpenChange,
    openDialog,
    draft,
    setDraft,
    handleSave,
    isValid: draft.trim().length > 0,
  };
};
