import styled from 'styled-components';

export const SortButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: `5px ${theme.spacing(2.5)}`,
  background: 'none',
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  '& .sort-label': { color: theme.textMuted, transition: 'color 0.15s' },
  '&:hover': { borderColor: theme.textMuted },
  '&:hover .sort-label': { color: theme.text },
}));
