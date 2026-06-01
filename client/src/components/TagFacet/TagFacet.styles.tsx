import styled from 'styled-components';

export const FacetList = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const FacetRow = styled('div')<{ $active: boolean; $disabled: boolean }>(
  ({ theme, $active, $disabled }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2.5),
    padding: `7px ${theme.spacing(2.25)}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    transition: 'background 0.13s',
    background: $active ? theme.accentSoft : 'transparent',
    ...($disabled && { opacity: 0.36, pointerEvents: 'none' }),
    '&:hover': {
      background: theme.accentSoft,
    },
    '& .facet-name': {
      color: $active ? theme.accent : theme.textMuted,
      transition: 'color 0.13s',
    },
    '&:hover .facet-name': {
      color: $active ? theme.accent : theme.text,
    },
  })
);

export const FacetTick = styled('span')<{ $active: boolean }>(({ theme, $active }) => ({
  width: '14px',
  height: '14px',
  borderRadius: theme.radius.sm,
  border: `1.5px solid ${$active ? theme.accent : theme.border}`,
  background: $active ? theme.accent : 'transparent',
  color: theme.textOnColor,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.13s',
}));

export const FacetName = styled('span')({
  flex: 1,
});

export const FacetCount = styled('span')({
  opacity: 0.7,
});

export const ClearButton = styled('button')(({ theme }) => ({
  alignSelf: 'flex-start',
  padding: `${theme.spacing(1)} ${theme.spacing(2.25)}`,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  textDecorationColor: theme.border,
  '& .clear-label': {
    color: theme.textMuted,
    transition: 'color 0.15s',
  },
  '&:hover .clear-label': {
    color: theme.text,
  },
}));
