import styled from 'styled-components';

export const Page = styled('div')(({ theme }) => ({
  minHeight: '100dvh',
  background: theme.bg,
}));

export const Content = styled('main')(({ theme }) => ({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
}));

export const TopBar = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
  borderBottom: `1px solid ${theme.border}`,
}));

export const BookGrid = styled('section')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
  gap: `${theme.spacing(7)} ${theme.spacing(5)}`,
}));
