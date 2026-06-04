import { useMetaEdit } from './useMetaEdit';

const parse = (draft: string): string[] =>
  draft
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const useAuthorEdit = (
  authors: string[],
  onSave: ((authors: string[]) => void) | undefined
) => {
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(authors.join('\n'));

  const isValid = parse(draft).length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave?.(parse(draft));
    handleOpenChange(false);
  };

  return { open, handleOpenChange, openDialog, draft, setDraft, isValid, handleSave };
};
