import { Input, EditDialog } from '@livre/primitives';
import type { useDateEdit } from '../../hooks/useDateEdit';

/**
 * Modal for editing the published date. Accepts MM/DD/YYYY via an auto-hyphen mask.
 */
export const DateDialog = (props: ReturnType<typeof useDateEdit>) => (
  <EditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit published date"
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Input
      type="text"
      inputMode="numeric"
      placeholder="MM/DD/YYYY"
      maxLength={10}
      value={props.draft}
      onChange={(e) => props.handleChange(e.target.value)}
      autoFocus
    />
  </EditDialog>
);
