import styled from 'styled-components';

export const LoadMoreRow = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(8),
}));

export const LoadMoreButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${theme.spacing(2.5)} ${theme.spacing(6)}`,
  background: 'none',
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  '& span': { transition: 'color 0.15s' },
  '&:hover:not(:disabled)': { borderColor: theme.textMuted },
  '&:hover:not(:disabled) span': { color: theme.text },
  '&:disabled': { cursor: 'default', opacity: 0.6 },
}));
