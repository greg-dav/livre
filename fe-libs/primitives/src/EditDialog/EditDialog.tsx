import { type ReactNode, type FormEvent } from 'react';
import styled from 'styled-components';
import { Text } from '../Text/Text';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Required unless hideActions is true. */
  isValid?: boolean;
  /** Required unless hideActions is true. */
  onSave?: () => void;
  /** Suppresses the standard Cancel/Save footer so the caller can render custom actions. */
  hideActions?: boolean;
  children: ReactNode;
}

const DialogForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
}));

/**
 * Standard flex row for dialog footers. Used by EditDialog's built-in Cancel/Save footer and
 * exported as EditDialog.Actions for callers that pass hideActions and render a custom footer.
 */
const DialogActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

/**
 * Modal shell for editing a single field or record. Wraps Dialog with a form element so Enter
 * submits, and provides a standard Cancel/Save footer. Pass hideActions to render a custom footer
 * (use EditDialog.Actions for consistent row layout). The caller owns open state and save logic.
 */
const EditDialogComponent = ({
  open,
  onOpenChange,
  title,
  description,
  isValid,
  onSave,
  hideActions,
  children,
}: EditDialogProps) => {
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
            <div style={{ flex: 1 }} />
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

export const EditDialog = Object.assign(EditDialogComponent, { Actions: DialogActions });
