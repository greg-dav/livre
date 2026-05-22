import { type ReactNode } from 'react';
import styled from 'styled-components';
import * as Radix from '@radix-ui/react-dropdown-menu';

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: Radix.DropdownMenuContentProps['align'];
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const StyledContent = styled(Radix.Content)(({ theme }) => ({
  minWidth: theme.spacing(40),
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1),
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  zIndex: 200,
}));

const Item = styled(Radix.Item)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  borderRadius: '6px',
  cursor: 'pointer',
  outline: 'none',

  '&[data-highlighted]': {
    background: theme.bgSurface,
  },

  '&[data-disabled]': {
    pointerEvents: 'none',
  },
}));

const Label = styled(Radix.Label)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
}));

const Separator = styled(Radix.Separator)(({ theme }) => ({
  height: '1px',
  background: theme.border,
  margin: theme.spacing(1),
}));

/**
 * Dropdown menu that manages its own trigger, portal, and content layout. Pass a trigger element
 * and compose the body using DropdownMenu.Item, DropdownMenu.Separator, and DropdownMenu.Label —
 * no Radix imports needed in calling code. Controlled open state is optional.
 */
const DropdownMenuComponent = ({
  trigger,
  children,
  align = 'start',
  sideOffset = 4,
  open,
  onOpenChange,
}: DropdownMenuProps) => (
  <Radix.Root open={open} onOpenChange={onOpenChange}>
    <Radix.Trigger asChild>{trigger}</Radix.Trigger>
    <Radix.Portal>
      <StyledContent align={align} sideOffset={sideOffset}>
        {children}
      </StyledContent>
    </Radix.Portal>
  </Radix.Root>
);

export const DropdownMenu = Object.assign(DropdownMenuComponent, { Item, Label, Separator });
