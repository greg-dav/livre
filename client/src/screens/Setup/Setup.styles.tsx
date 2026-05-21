import styled from 'styled-components';

export const Page = styled('div')(({ theme }) => ({
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(8),
  padding: theme.spacing(6),
  background: theme.bg,
}));
