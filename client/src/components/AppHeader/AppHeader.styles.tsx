import styled from 'styled-components';

export const Header = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
  borderBottom: `1px solid ${theme.border}`,
}));

export const Actions = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
}));

export const IconButton = styled('button')(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  border: `1px solid ${theme.border}`,
  borderRadius: '6px',
  background: 'transparent',
  cursor: 'pointer',
  color: theme.textMuted,
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&:hover': {
    borderColor: theme.textMuted,
  },
}));
