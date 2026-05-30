import styled from 'styled-components';

export const ThemeGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: theme.spacing(4),
}));

export const ThemeOption = styled('button')<{ $active?: boolean }>(({ theme, $active }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: theme.radius.lg,
  border: `1px solid ${$active ? theme.accent : theme.border}`,
  background: theme.bgElevated,
  cursor: 'pointer',
  textAlign: 'left',
  boxShadow: $active ? `0 0 0 3px ${theme.accentSoft}` : 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  '&:hover': {
    borderColor: $active ? theme.accent : theme.textMuted,
  },
}));

export const ThemeOptionFooter = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: `0 ${theme.spacing(1)}`,
  color: theme.accent,
}));
