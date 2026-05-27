import { Input } from '@livre/primitives';
import { MetaEditDialog } from '../MetaEditDialog/MetaEditDialog';
import type { useDateEdit } from '../../hooks/useDateEdit';

/**
 * Modal for editing the published date. Accepts YYYY, YYYY-MM, or YYYY-MM-DD. The hook
 * provides auto-hyphen insertion so users can type digits continuously.
 */
export const DateDialog = (props: ReturnType<typeof useDateEdit>) => (
  <MetaEditDialog
    open={props.open}
    onOpenChange={props.handleOpenChange}
    title="Edit published date"
    description="Enter a year (2019), year and month (2019-09), or full date (2019-09-17)."
    isValid={props.isValid}
    onSave={props.handleSave}
  >
    <Input
      type="text"
      inputMode="numeric"
      placeholder="YYYY-MM-DD"
      maxLength={10}
      value={props.draft}
      onChange={(e) => props.handleChange(e.target.value)}
      autoFocus
    />
  </MetaEditDialog>
);
