import { Input } from '@livre/primitives';
import { EditDialog } from '@livre/primitives';
import type { usePublisherEdit } from '../../hooks/usePublisherEdit';

/**
 * Modal for editing the publisher field. Free-text input with a non-empty value requirement.
 * Receives the hook's return value directly so the caller owns open state.
 */
export const PublisherDialog = (props: ReturnType<typeof usePublisherEdit>) => (
  <EditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit publisher"
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Input
      type="text"
      placeholder="Publisher name"
      value={props.draft}
      onChange={(e) => props.setDraft(e.target.value)}
      autoFocus
    />
  </EditDialog>
);
