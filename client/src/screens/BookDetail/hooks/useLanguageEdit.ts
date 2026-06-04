import { useMetaEdit } from './useMetaEdit';
import type { SelectOption } from '@livre/primitives';

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

const label = (code: string) => {
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const COMMON_CODES = [
  'en',
  'fr',
  'de',
  'es',
  'pt',
  'it',
  'ru',
  'ja',
  'zh',
  'ko',
  'ar',
  'nl',
  'pl',
  'sv',
  'no',
  'da',
  'fi',
  'hu',
  'cs',
  'tr',
  'he',
  'hi',
  'vi',
  'id',
  'uk',
  'ro',
  'el',
  'th',
  'fa',
];

export const LANGUAGE_OPTIONS: SelectOption[] = COMMON_CODES.map((code) => ({
  value: code,
  label: label(code) ?? code,
}));

export const useLanguageEdit = (
  language: string | undefined,
  onSave: ((language: string) => void) | undefined
) => {
  const currentCode = language ?? '';
  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(
    COMMON_CODES.includes(currentCode) ? currentCode : ''
  );

  const isValid = draft.length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave?.(draft);
    handleOpenChange(false);
  };

  return { open, handleOpenChange, openDialog, draft, setDraft, isValid, handleSave };
};
