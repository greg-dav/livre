import { type ReactNode } from 'react';
import styled from 'styled-components';
import * as Radix from '@radix-ui/react-dialog';
import { Text } from '../Text/Text';

interface DialogProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Overlay = styled(Radix.Overlay)({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 200,
});

const Content = styled(Radix.Content)(({ theme }) => ({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: theme.spacing(120),
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(6),
  boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
  zIndex: 201,

  '&:focus': {
    outline: 'none',
  },
}));

/**
 * Modal dialog with built-in overlay, portal, and accessible title. Pass a trigger element for
 * uncontrolled usage, or omit it and manage open/onOpenChange yourself for controlled usage.
 * Use Dialog.Close to add a close button inside the dialog body.
 */
const DialogComponent = ({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: DialogProps) => (
  <Radix.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Radix.Trigger asChild>{trigger}</Radix.Trigger>}
    <Radix.Portal>
      <Overlay />
      <Content>
        <Radix.Title asChild>
          <Text variant="h5">{title}</Text>
        </Radix.Title>
        {description && (
          <Radix.Description asChild>
            <Text variant="ui-sm" color="muted">
              {description}
            </Text>
          </Radix.Description>
        )}
        {children}
      </Content>
    </Radix.Portal>
  </Radix.Root>
);

export const Dialog = Object.assign(DialogComponent, { Close: Radix.Close });
