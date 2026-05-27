import { Input } from '@livre/primitives';
import { MetaEditDialog } from '../MetaEditDialog/MetaEditDialog';
import type { usePageCountEdit } from '../../hooks/usePageCountEdit';

/**
 * Modal for editing the page count. Restricts to positive integer input.
 */
export const PageCountDialog = (props: ReturnType<typeof usePageCountEdit>) => (
  <MetaEditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit page count"
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Input
      type="number"
      min={1}
      step={1}
      placeholder="e.g. 352"
      value={props.draft}
      onChange={(e) => props.setDraft(e.target.value)}
      autoFocus
    />
  </MetaEditDialog>
);
