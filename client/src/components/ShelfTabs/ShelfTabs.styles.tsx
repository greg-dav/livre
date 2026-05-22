import styled from 'styled-components';

export const TabRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}));

export const Tab = styled('button')<{ $active: boolean }>(({ theme, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: '0.4375rem 0.875rem',
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
  background: $active ? theme.bgElevated : 'transparent',
  cursor: 'pointer',
  transition: 'background 0.15s',

  '&:hover span': {
    color: theme.text,
  },
}));

export const Badge = styled('span')(({ theme }) => ({
  background: theme.border,
  borderRadius: theme.radius.full,
  padding: '0.0625rem 0.4375rem',
}));
