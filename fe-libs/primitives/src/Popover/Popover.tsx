import { type ReactNode } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import * as Radix from '@radix-ui/react-popover';

// keyframes objects cannot be interpolated in object-syntax styled components in v6 — they must
// live in a css`` or createGlobalStyle`` tagged literal. Reference the animation by its stable name.
const PopoverKeyframes = createGlobalStyle`
  @keyframes livre-popover-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: Radix.PopoverContentProps['align'];
  side?: Radix.PopoverContentProps['side'];
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const StyledContent = styled(Radix.Content)(({ theme }) => ({
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.lg,
  padding: theme.spacing(2),
  boxShadow: '0 10px 32px rgba(0,0,0,0.20)',
  zIndex: 200,
  '&[data-state="open"]': { animation: 'livre-popover-in 0.16s ease' },
}));

/**
 * Click-triggered floating panel for interactive content (filters, pickers). Manages its own
 * trigger, portal, positioning, and dismiss (outside-click / Escape) — unlike Tooltip/HoverCard it
 * is keyboard- and touch-operable, so it's the right home for controls rather than mere hints.
 * Pass a trigger element and the panel body as children. Controlled open state is optional.
 */
export const Popover = ({
  trigger,
  children,
  align = 'end',
  side = 'top',
  sideOffset = 8,
  open,
  onOpenChange,
}: PopoverProps) => (
  <Radix.Root open={open} onOpenChange={onOpenChange}>
    <PopoverKeyframes />
    <Radix.Trigger asChild>{trigger}</Radix.Trigger>
    <Radix.Portal>
      <StyledContent align={align} side={side} sideOffset={sideOffset}>
        {children}
      </StyledContent>
    </Radix.Portal>
  </Radix.Root>
);
