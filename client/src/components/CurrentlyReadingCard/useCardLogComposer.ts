import { useRef, useState } from 'react';

type LogType = 'note' | 'quote';

/**
 * Drives the inline log composer on the currently-reading card: which action (note or quote) is
 * open, the contenteditable field's empty state, and its keyboard shortcuts. Enter and Cmd/Ctrl+Enter
 * commit; Escape closes without saving. Kept separate from the API layer — the caller supplies onLog.
 */
export const useCardLogComposer = (onLog?: (type: LogType, text: string) => void) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [openType, setOpenType] = useState<LogType | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const open = (type: LogType) => {
    if (!onLog) return;
    setOpenType(type);
    setIsEmpty(true);
    // Focus once the field has mounted.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const close = () => {
    if (inputRef.current) inputRef.current.textContent = '';
    setOpenType(null);
    setIsEmpty(true);
  };

  const handleInput = () => {
    const el = inputRef.current;
    if (!el) return;
    // Normalize the lone <br> browsers drop into emptied contenteditables.
    if (el.innerHTML === '<br>') el.textContent = '';
    setIsEmpty(!el.textContent?.trim());
  };

  const save = () => {
    const text = inputRef.current?.textContent?.trim() ?? '';
    if (!text || !openType) return;
    onLog?.(openType, text);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const handleBlur = () => {
    if (isEmpty) close();
  };

  return { inputRef, openType, isEmpty, open, close, save, handleInput, handleKeyDown, handleBlur };
};
