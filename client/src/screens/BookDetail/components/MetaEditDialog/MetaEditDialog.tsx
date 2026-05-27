import { type ReactNode, type FormEvent } from 'react';
import { Text, Button, Dialog } from '@livre/primitives';
import { DialogForm, DialogActions } from './MetaEditDialog.styles';

interface MetaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Required unless hideActions is true. */
  isValid?: boolean;
  /** Required unless hideActions is true. */
  onSave?: () => void;
  /** When true, suppresses the standard Cancel/Save footer so the caller can render custom actions. */
  hideActions?: boolean;
  children: ReactNode;
}

/**
 * Shared modal shell for all metadata field edits. Wraps Dialog with a form element so Enter
 * submits, and provides the standard Cancel/Save footer. Pass hideActions when the caller needs
 * to render its own action row (e.g. the ISBN lookup result with Save ISBN only / Update metadata).
 * The caller owns open state and the save callback — this component is purely structural.
 */
export const MetaEditDialog = ({
  open,
  onOpenChange,
  title,
  description,
  isValid,
  onSave,
  hideActions,
  children,
}: MetaEditDialogProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isValid && onSave) onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <DialogForm onSubmit={handleSubmit}>
        {children}
        {!hideActions && (
          <DialogActions>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" type="button">
                <Text variant="label">Cancel</Text>
              </Button>
            </Dialog.Close>
            <Button variant="primary" size="sm" type="submit" disabled={!isValid}>
              <Text variant="label" color="onColor">
                Save
              </Text>
            </Button>
          </DialogActions>
        )}
      </DialogForm>
    </Dialog>
  );
};
