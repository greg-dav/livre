import styled from 'styled-components';

export const Placeholder = styled('div')(({ theme }) => ({
  minHeight: '60vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  textAlign: 'center',
}));
