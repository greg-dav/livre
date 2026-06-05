import styled from 'styled-components';

export const TabRow = styled('div')(({ theme }) => ({
  display: 'flex',
  borderBottom: `1px solid ${theme.borderSoft}`,
  marginBottom: theme.spacing(8),
  // The three labelled tabs + badges overflow a phone width, so scroll them horizontally — and bleed
  // the track edge-to-edge by cancelling the page inset, so the underline and tabs run to the screen
  // edges rather than sitting in a boxed-in strip.
  [theme.media.mobile]: {
    overflowX: 'auto',
    marginBottom: theme.spacing(6),
    marginInline: `-${theme.spacing(4)}`,
    paddingInline: theme.spacing(4),
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  },
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
  [theme.media.mobile]: {
    flexShrink: 0,
    padding: '10px 14px 12px',
    whiteSpace: 'nowrap',
  },

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
