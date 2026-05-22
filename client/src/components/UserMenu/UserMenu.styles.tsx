import styled from 'styled-components';

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
}));
