import { Text, Button, Input } from '@livre/primitives';
import type { useLogEntryEdit } from '../../hooks/useLogEntryEdit';
import { EVENT_TITLES } from './LogEntryEditDialog';
import {
  DeleteButton,
  FooterSpacer,
  NoteTextarea,
  InlinePanel,
  InlineHead,
  InlineBackButton,
  InlineFields,
  InlineActions,
} from './LogEntryEditDialog.styles';

/**
 * Inline counterpart to LogEntryEditDialog for the mobile journal sheet. Editing a log entry from
 * inside a bottom sheet would otherwise stack a second sheet over the first; instead this swaps the
 * sheet's composer/timeline region for the editor in place, with a back affordance to return. Same
 * fields and hook as the dialog — only the chrome differs.
 */
export const LogEntryEditInline = (props: ReturnType<typeof useLogEntryEdit>) => {
  const { editingEntry } = props;
  if (!editingEntry) return null;

  return (
    <InlinePanel>
      <InlineHead>
        <InlineBackButton
          type="button"
          onClick={() => props.handleOpenChange(false)}
          aria-label="Back to journal"
        >
          <Text variant="label">← Back</Text>
        </InlineBackButton>
        <Text variant="label" color="muted">
          {EVENT_TITLES[editingEntry.event] ?? 'Edit entry'}
        </Text>
      </InlineHead>
      <InlineFields>
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
      </InlineFields>
      <InlineActions>
        <DeleteButton type="button" onClick={props.handleDelete}>
          <Text variant="label">Delete</Text>
        </DeleteButton>
        <FooterSpacer />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => props.handleOpenChange(false)}
        >
          <Text variant="label">Cancel</Text>
        </Button>
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
      </InlineActions>
    </InlinePanel>
  );
};
