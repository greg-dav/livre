import styled from 'styled-components';

/**
 * Styled text input. Intended to be used with Radix Form.Control asChild so it participates in
 * form validation context. Inherits font from the body so it stays in sync with the UI type scale
 * without hardcoding font properties.
 */
export const Input = styled('input')(({ theme }) => ({
  width: '100%',
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.sm,
  color: theme.text,
  font: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
  '&:focus': {
    borderColor: theme.accent,
    boxShadow: `0 0 0 3px ${theme.accentSoft}`,
  },
}));
