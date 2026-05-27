import { useState } from 'react';
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

// Common languages in approximate reading-frequency order.
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
  label: `${label(code)} (${code})`,
}));

const OTHER = '__other__';

export const useLanguageEdit = (
  language: string | undefined,
  onSave: ((language: string) => void) | undefined
) => {
  const currentCode = language ?? '';
  const isCommon = COMMON_CODES.includes(currentCode);

  const { open, draft, setDraft, openDialog, handleOpenChange } = useMetaEdit(
    isCommon ? currentCode : currentCode ? OTHER : ''
  );

  // When using the "Other" option, the user types a raw BCP-47 tag.
  const [customCode, setCustomCode] = useState(isCommon ? '' : currentCode);

  const effectiveCode = draft === OTHER ? customCode.trim().toLowerCase() : draft;
  const isValid = effectiveCode.length >= 2;

  const handleSave = () => {
    if (isValid) onSave?.(effectiveCode);
  };

  return {
    open,
    handleOpenChange,
    openDialog,
    draft,
    setDraft,
    customCode,
    setCustomCode,
    showCustom: draft === OTHER,
    isValid,
    handleSave,
    OTHER,
  };
};
