import styled from 'styled-components';

/*
 * Compound ISBN input: the wrapper owns the border and focus ring (matching Input's styling) so
 * the inner text field and the inline button feel like a single control. The divider gives the
 * button a subtle visual separation without a second full border.
 */
export const IsbnInputWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.sm,
  overflow: 'hidden',
  transition: 'border-color 0.15s',

  '&:focus-within': {
    borderColor: theme.accent,
    boxShadow: `0 0 0 3px ${theme.accentSoft}`,
  },
}));

export const IsbnBareInput = styled('input')(({ theme }) => ({
  flex: 1,
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  background: theme.bg,
  border: 'none',
  color: theme.text,
  font: 'inherit',
  outline: 'none',
  minWidth: 0,
}));

export const InlineDivider = styled('div')(({ theme }) => ({
  width: '1px',
  background: theme.border,
  flexShrink: 0,
}));

export const InlineLookupButton = styled('button')(({ theme }) => ({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${theme.spacing(4)}`,
  background: theme.bgElevated,
  color: theme.text,
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.15s, opacity 0.15s',
  whiteSpace: 'nowrap',

  '&:hover': {
    background: theme.accentSoft,
  },

  '&:disabled': {
    opacity: 0.4,
    cursor: 'default',
    '&:hover': { background: theme.bgElevated },
  },
}));

export const StatusText = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
}));
