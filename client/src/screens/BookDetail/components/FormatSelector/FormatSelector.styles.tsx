import styled from 'styled-components';

export const FormatRow = styled('div')({
  marginTop: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  alignItems: 'flex-start',
});

export const FormatSelectorWrap = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  border: `1px solid ${theme.border}`,
  borderRadius: '8px',
  overflow: 'hidden',
}));

export const FormatOpt = styled('button')<{ $active: boolean }>(({ theme, $active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  color: $active ? theme.accent : theme.textMuted,
  background: $active ? theme.accentSoft : theme.bgElevated,
  border: 'none',
  borderRight: `1px solid ${theme.border}`,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  '&:last-child': {
    borderRight: 'none',
  },
  '&:hover': {
    background: theme.bgSunken,
    color: theme.text,
  },
  ...($active && {
    '&:hover': {
      background: theme.accentSoft,
      color: theme.accent,
    },
  }),
  '& span': { color: 'inherit' },
}));
