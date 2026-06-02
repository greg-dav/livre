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

interface PopoverItemProps {
  active?: boolean;
  onSelect?: () => void;
  children: ReactNode;
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

// Menu body — a column of Items. Min-width keeps the floating panel from collapsing on short labels.
const Panel = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: theme.spacing(45),
}));

// One selectable row. `$active` paints the current selection with the accent the way the timeline
// period picker does; the `.menu-label` child (a <Text>) inherits the muted→text hover transition.
const ItemRow = styled('button')<{ $active?: boolean }>(({ theme, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  padding: `7px ${theme.spacing(2.25)}`,
  borderRadius: theme.radius.md,
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.13s',
  background: $active ? theme.accentSoft : 'transparent',
  '& .menu-label': {
    color: $active ? theme.accent : theme.textMuted,
    transition: 'color 0.13s',
  },
  '&:hover': { background: theme.accentSoft },
  '&:hover .menu-label': { color: $active ? theme.accent : theme.text },
}));

/**
 * Selectable menu row. Wrapped in Radix `Close` so picking an option dismisses the popover without
 * the caller tracking open state. Mark the current value with `active` for the accent highlight.
 */
const Item = ({ active, onSelect, children }: PopoverItemProps) => (
  <Radix.Close asChild>
    <ItemRow type="button" $active={active} onClick={onSelect}>
      {children}
    </ItemRow>
  </Radix.Close>
);

/**
 * Click-triggered floating panel for interactive content (filters, pickers, menus). Manages its own
 * trigger, portal, positioning, and dismiss (outside-click / Escape) — unlike Tooltip/HoverCard it
 * is keyboard- and touch-operable, so it's the right home for controls rather than mere hints. Pass
 * a trigger element and the panel body as children; compose menus with Popover.Panel and
 * Popover.Item. Controlled open state is optional.
 */
const PopoverComponent = ({
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

export const Popover = Object.assign(PopoverComponent, { Panel, Item, Close: Radix.Close });
