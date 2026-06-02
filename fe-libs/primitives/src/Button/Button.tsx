import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { StyledButton } from './Button.styles';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * General-purpose button primitive. Callers are responsible for text content — wrap children in
 * <Text variant="label"> with the appropriate color (onColor for primary, onDark for destructive,
 * default for others).
 * Designed to slot into Radix Form.Submit and other Radix asChild contexts via ref forwarding.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, ...props }, ref) => (
    <StyledButton $variant={variant} $size={size} ref={ref} {...props}>
      {children}
    </StyledButton>
  )
);
