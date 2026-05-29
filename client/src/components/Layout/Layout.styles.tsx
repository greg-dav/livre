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
  gap: theme.spacing(6),
  padding: `${theme.spacing(5)} ${theme.spacing(8)}`,
  borderBottom: `1px solid ${theme.borderSoft}`,
  background: theme.bg,
}));

export const Content = styled('main')<{ $fullWidth?: boolean; $focusMode?: boolean }>(
  ({ theme, $fullWidth, $focusMode }) =>
    $fullWidth
      ? {}
      : {
          maxWidth: $focusMode ? '1240px' : '1320px',
          margin: '0 auto',
          padding: `${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(8),
          transition: 'max-width 0.25s ease',
        }
);

export const BackButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& span': {
    color: theme.textMuted,
    transition: 'color 0.15s',
  },
  '&:hover span': {
    color: theme.text,
  },
}));
