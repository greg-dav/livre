import styled from 'styled-components';

/**
 * Styled multi-line text input, visually consistent with Input. Fixed height via minHeight on the
 * caller; resize is disabled so the dialog layout stays stable.
 */
export const Textarea = styled('textarea')(({ theme }) => ({
  width: '100%',
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.sm,
  color: theme.text,
  font: 'inherit',
  outline: 'none',
  resize: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  '&:focus': {
    borderColor: theme.accent,
    boxShadow: `0 0 0 3px ${theme.accentSoft}`,
  },
}));
