import styled from 'styled-components';

export const Page = styled('div')(({ theme }) => ({
  minHeight: '100dvh',
  background: theme.bg,
}));

export const TopBar = styled('header')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 100,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: theme.spacing(4),
  padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
  borderBottom: `1px solid ${theme.border}`,
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
