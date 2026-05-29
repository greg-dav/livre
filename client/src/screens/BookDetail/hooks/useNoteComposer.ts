import { useRef, useState } from 'react';

type NoteType = 'note' | 'quote';

/**
 * Manages the note/quote composer state: which type is active, whether the field is empty,
 * and keyboard shortcuts (Cmd/Ctrl+Enter to save, Escape to clear). The inputRef attaches
 * to the contenteditable div. The caller provides onSave so this hook stays decoupled from
 * the API layer.
 */
export const useNoteComposer = () => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<NoteType>('note');
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    if (inputRef.current) inputRef.current.textContent = '';
    setIsEmpty(true);
  };

  const handleInput = () => {
    const el = inputRef.current;
    if (!el) return;
    // Normalize lone <br> that browsers insert into empty contenteditables
    if (el.innerHTML === '<br>') el.textContent = '';
    setIsEmpty(!el.textContent?.trim());
  };

  const handleSave = (onSave: (text: string, noteType: NoteType) => void) => {
    const text = inputRef.current?.textContent?.trim() ?? '';
    if (!text) return;
    onSave(text, type);
    clear();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    onSave: (text: string, noteType: NoteType) => void
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave(onSave);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clear();
      inputRef.current?.blur();
    }
  };

  return { inputRef, type, setType, isEmpty, handleInput, handleSave, handleKeyDown };
};
