import styled from 'styled-components';

export const Nav = styled('nav')(({ theme }) => ({
  zIndex: 100,
  height: '100%',
  width: theme.spacing(14),
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: `${theme.spacing(4.5)} 0`,
  background: theme.bgElevated,
  borderRight: `1px solid ${theme.borderSoft}`,
  // The mobile bar (BottomNav) replaces the rail below the phone breakpoint.
  [theme.media.mobile]: {
    display: 'none',
  },
}));

export const WordmarkRail = styled('div')(({ theme }) => ({
  opacity: 0.4,
  marginBottom: theme.spacing(5),
  writingMode: 'vertical-lr',
  transform: 'rotate(180deg)',
  transition: 'opacity 0.15s',
  '&:hover': {
    opacity: 0.7,
  },
}));

export const Spacer = styled('div')({
  flex: 1,
});

export const Item = styled('button')<{ $active?: boolean }>(({ theme, $active }) => ({
  position: 'relative',
  width: theme.spacing(9),
  height: theme.spacing(9),
  borderRadius: '9px',
  border: 'none',
  background: $active ? theme.accentSoft : 'none',
  color: $active ? theme.accent : theme.textMuted,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s, color 0.15s',
  '&:hover': {
    background: theme.accentSoft,
    color: $active ? theme.accent : theme.text,
  },
  '&:hover > [data-tip]': {
    opacity: 1,
  },
}));

export const Tip = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 'calc(100% + 10px)',
  top: '50%',
  transform: 'translateY(-50%)',
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: '5px',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity 0.15s',
  boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
  zIndex: 200,
}));
