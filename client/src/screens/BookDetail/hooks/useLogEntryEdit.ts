import { useState, useCallback } from 'react';
import type { LogEntry } from '@livre/types';
import {
  DATE_DISPLAY_RE,
  storedToDisplay,
  displayToStored,
  applyDateMask,
} from '../../../lib/dateInput';

/**
 * Manages edit dialog state for a single log entry. The calling component decides which entry
 * is being edited; this hook owns the draft fields and wires save/delete to the parent callbacks.
 * Supports note/quote (text + date) and landmark entries (date only).
 */
export const useLogEntryEdit = (
  onUpdate: (logId: number, fields: { text?: string; date?: string }) => void,
  onDelete: (logId: number) => void
) => {
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftDate, setDraftDate] = useState('');

  const openEdit = useCallback((entry: LogEntry) => {
    setEditingEntry(entry);
    setDraftText(entry.event === 'note' || entry.event === 'quote' ? entry.text : '');
    setDraftDate(storedToDisplay(entry.date));
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingEntry(null);
  }, []);

  const handleDateChange = useCallback((raw: string) => {
    setDraftDate(applyDateMask(raw));
  }, []);

  const isTextEntry = editingEntry?.event === 'note' || editingEntry?.event === 'quote';

  const isValid = (() => {
    if (!editingEntry) return false;
    const dateOk = DATE_DISPLAY_RE.test(draftDate);
    const textOk = isTextEntry ? draftText.trim().length > 0 : true;
    return dateOk && textOk;
  })();

  const handleSave = useCallback(() => {
    if (!editingEntry || !isValid) return;
    const storedDate = displayToStored(draftDate);
    const fields: { text?: string; date?: string } = { date: storedDate };
    if (isTextEntry) fields.text = draftText;
    onUpdate(editingEntry.id, fields);
    setEditingEntry(null);
  }, [editingEntry, isValid, draftDate, draftText, isTextEntry, onUpdate]);

  const handleDelete = useCallback(() => {
    if (!editingEntry) return;
    onDelete(editingEntry.id);
    setEditingEntry(null);
  }, [editingEntry, onDelete]);

  return {
    editingEntry,
    openEdit,
    handleOpenChange,
    draftText,
    setDraftText,
    draftDate,
    handleDateChange,
    isTextEntry,
    isValid,
    handleSave,
    handleDelete,
  };
};
