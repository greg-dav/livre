import { type ReactNode } from 'react';
import styled from 'styled-components';
import * as Radix from '@radix-ui/react-tooltip';

export const TooltipProvider = Radix.Provider;

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: Radix.TooltipContentProps['side'];
  sideOffset?: number;
}

const StyledContent = styled(Radix.Content)(({ theme }) => ({
  background: theme.text,
  color: theme.bg,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: theme.spacing(1),
  maxWidth: theme.spacing(60),
}));

/**
 * Tooltip that wraps its trigger implicitly — pass children as the element that activates the
 * tooltip. Requires a TooltipProvider ancestor (mount once at app root). Content is typically
 * plain text but accepts any node.
 */
export const Tooltip = ({ content, children, side = 'top', sideOffset = 4 }: TooltipProps) => (
  <Radix.Root>
    <Radix.Trigger asChild>{children}</Radix.Trigger>
    <Radix.Portal>
      <StyledContent side={side} sideOffset={sideOffset}>
        {content}
      </StyledContent>
    </Radix.Portal>
  </Radix.Root>
);
