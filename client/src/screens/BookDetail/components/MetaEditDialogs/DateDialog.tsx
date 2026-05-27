import { Input } from '@livre/primitives';
import { MetaEditDialog } from '../MetaEditDialog/MetaEditDialog';
import type { useDateEdit } from '../../hooks/useDateEdit';

/**
 * Modal for editing the published date. Accepts MM/DD/YYYY via an auto-hyphen mask.
 */
export const DateDialog = (props: ReturnType<typeof useDateEdit>) => (
  <MetaEditDialog
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
  </MetaEditDialog>
);
