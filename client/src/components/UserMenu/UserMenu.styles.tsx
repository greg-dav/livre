import styled from 'styled-components';

export const DialogForm = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(5),
}));

export const DialogActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(3),
}));

export const Trigger = styled('button')(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  border: `1px solid ${theme.border}`,
  borderRadius: '50%',
  background: 'transparent',
  cursor: 'pointer',
  color: theme.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&:hover': {
    borderColor: theme.textMuted,
  },
  '&[data-state="open"]': {
    borderColor: theme.accent,
    color: theme.accent,
  },
}));
