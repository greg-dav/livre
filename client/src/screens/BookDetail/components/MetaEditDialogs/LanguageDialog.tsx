import { Select } from '@livre/primitives';
import { EditDialog } from '@livre/primitives';
import { LANGUAGE_OPTIONS } from '../../hooks/useLanguageEdit';
import type { useLanguageEdit } from '../../hooks/useLanguageEdit';

/**
 * Modal for editing the language. Presents a curated list of common languages via a Select.
 */
export const LanguageDialog = (props: ReturnType<typeof useLanguageEdit>) => (
  <EditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit language"
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Select
      value={props.draft}
      onValueChange={props.setDraft}
      options={LANGUAGE_OPTIONS}
      placeholder="Select a language…"
    />
  </EditDialog>
);
