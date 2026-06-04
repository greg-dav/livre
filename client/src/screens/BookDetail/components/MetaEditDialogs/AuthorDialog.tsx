import { Textarea } from '@livre/primitives';
import { EditDialog } from '@livre/primitives';
import type { useAuthorEdit } from '../../hooks/useAuthorEdit';

/**
 * Modal for editing the author list. One author per line so multi-author books edit cleanly and
 * names that contain commas (e.g. "Last, First" forms) survive untouched. Requires at least one
 * non-empty line. Receives the hook's return value directly so the caller owns open state.
 */
export const AuthorDialog = (props: ReturnType<typeof useAuthorEdit>) => (
  <EditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit authors"
    description="One author per line."
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Textarea
      placeholder="Cormac McCarthy"
      value={props.draft}
      onChange={(e) => props.setDraft(e.target.value)}
      rows={4}
      autoFocus
    />
  </EditDialog>
);
