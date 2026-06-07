import { Text, Button, Input, Dialog, EditDialog } from '@livre/primitives';
import type { useLogEntryEdit } from '../../hooks/useLogEntryEdit';
import { DeleteButton, FooterSpacer, NoteTextarea } from './LogEntryEditDialog.styles';

export const EVENT_TITLES: Record<string, string> = {
  note: 'Edit note',
  quote: 'Edit quote',
  shelved: 'Edit shelved date',
  started: 'Edit started date',
  restarted: 'Edit restarted date',
  finished: 'Edit finished date',
  dnf: 'Edit did not finish date',
};

/**
 * Dialog for editing or deleting a reading log entry. Adapts its fields based on entry type:
 * notes and quotes show a text area plus a date field; landmark events show only a date field.
 * Delete is always available and closes the dialog immediately after calling the parent callback.
 */
export const LogEntryEditDialog = (props: ReturnType<typeof useLogEntryEdit>) => {
  const { editingEntry } = props;
  const open = editingEntry !== null;

  return (
    <EditDialog
      open={open}
      onOpenChange={props.handleOpenChange}
      title={editingEntry ? (EVENT_TITLES[editingEntry.event] ?? 'Edit entry') : 'Edit entry'}
      hideActions
    >
      {props.isTextEntry && (
        <NoteTextarea
          value={props.draftText}
          onChange={(e) => props.setDraftText(e.target.value)}
          autoFocus
        />
      )}
      <Input
        type="text"
        inputMode="numeric"
        placeholder="MM/DD/YYYY"
        maxLength={10}
        value={props.draftDate}
        onChange={(e) => props.handleDateChange(e.target.value)}
        autoFocus={!props.isTextEntry}
      />
      <EditDialog.Actions>
        <DeleteButton type="button" onClick={props.handleDelete}>
          <Text variant="label">Delete</Text>
        </DeleteButton>
        <FooterSpacer />
        <Dialog.Close asChild>
          <Button variant="ghost" size="sm" type="button">
            <Text variant="label">Cancel</Text>
          </Button>
        </Dialog.Close>
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!props.isValid}
          onClick={props.handleSave}
        >
          <Text variant="label" color="onColor">
            Save
          </Text>
        </Button>
      </EditDialog.Actions>
    </EditDialog>
  );
};
