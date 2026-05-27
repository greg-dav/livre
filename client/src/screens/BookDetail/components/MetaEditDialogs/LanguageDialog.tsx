import { Select, Input } from '@livre/primitives';
import { MetaEditDialog } from '../MetaEditDialog/MetaEditDialog';
import { LANGUAGE_OPTIONS } from '../../hooks/useLanguageEdit';
import type { useLanguageEdit } from '../../hooks/useLanguageEdit';

const OTHER_OPTION = { value: '__other__', label: 'Other…' };
const OPTIONS = [...LANGUAGE_OPTIONS, OTHER_OPTION];

/**
 * Modal for editing the language. Shows a Select with common languages and an "Other" option
 * that reveals a free-text BCP 47 code input (e.g. "zh-Hant", "pt-BR").
 */
export const LanguageDialog = (props: ReturnType<typeof useLanguageEdit>) => (
  <MetaEditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit language"
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Select
      value={props.draft}
      onValueChange={props.setDraft}
      options={OPTIONS}
      placeholder="Select a language…"
    />
    {props.showCustom && (
      <Input
        type="text"
        placeholder="BCP 47 language code, e.g. zh-Hant"
        value={props.customCode}
        onChange={(e) => props.setCustomCode(e.target.value)}
        autoFocus
      />
    )}
  </MetaEditDialog>
);
