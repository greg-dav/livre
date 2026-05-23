import styled from 'styled-components';
import type { ButtonVariant, ButtonSize } from './Button';

export const StyledButton = styled('button')<{ $variant: ButtonVariant; $size: ButtonSize }>(
  ({ theme, $variant, $size }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    border: 'none',

    ...($size === 'sm' && {
      padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
    }),
    ...($size === 'md' && {
      padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
    }),

    ...($variant === 'primary' && {
      background: theme.accent,
      color: theme.textOnColor,
    }),
    ...($variant === 'secondary' && {
      background: theme.bgElevated,
      color: theme.text,
      border: `1px solid ${theme.border}`,
    }),
    ...($variant === 'ghost' && {
      background: 'transparent',
      color: theme.text,
    }),

    '&:hover:not(:disabled)': {
      opacity: 0.88,
    },
    '&[data-state="open"]:not(:disabled)': {
      opacity: 0.82,
    },
    '&:disabled': {
      opacity: 0.55,
      cursor: 'not-allowed',
    },
  })
);
