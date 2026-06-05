import styled from 'styled-components';

export const Pill = styled('div')(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(6),
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)} ${theme.spacing(1.5)} ${theme.spacing(3.5)}`,
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.full,
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  // Lift clear of the mobile bottom nav so it never sits underneath it.
  [theme.media.mobile]: {
    bottom: theme.spacing(20),
  },
}));

export const Label = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  paddingRight: theme.spacing(2.5),
  marginRight: theme.spacing(0.5),
  borderRight: `1px solid ${theme.borderSoft}`,
}));

export const Dot = styled('span')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: theme.radius.full,
  background: theme.accent,
}));
