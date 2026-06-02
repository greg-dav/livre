import styled from 'styled-components';

export const DialogActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
  marginTop: theme.spacing(6),
}));
