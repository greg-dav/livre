import styled from 'styled-components';

export const TabRow = styled('div')(({ theme }) => ({
  display: 'flex',
  borderBottom: `1px solid ${theme.borderSoft}`,
  marginBottom: theme.spacing(8),
}));

export const Tab = styled('button')<{ $active: boolean }>(({ theme, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: '10px 20px 13px',
  border: 'none',
  borderBottom: `2px solid ${$active ? theme.accent : 'transparent'}`,
  marginBottom: '-1px',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.15s',

  '& > span:first-child': {
    transition: 'color 0.15s',
  },

  '&:hover > span:first-child': {
    color: theme.text,
  },
}));

export const Badge = styled('span')<{ $active: boolean }>(({ theme, $active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  background: $active ? theme.accentSoft : theme.bgSunken,
  borderRadius: theme.radius.full,
  padding: '2px 0.4375rem',
  transition: 'background 0.15s, color 0.15s',
}));
