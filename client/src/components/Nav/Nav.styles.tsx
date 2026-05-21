import styled from 'styled-components';

export const Bar = styled('nav')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  borderBottom: `1px solid ${theme.border}`,
  background: theme.bg,
}));

export const Tabs = styled('div')({
  display: 'flex',
  flex: 1,
});

export const Tab = styled('button')<{ $active: boolean }>(({ theme, $active }) => ({
  padding: `${theme.spacing(3.5)} ${theme.spacing(5)}`,
  border: 'none',
  borderRight: `1px solid ${theme.border}`,
  borderBottom: `2px solid ${$active ? theme.text : 'transparent'}`,
  background: 'transparent',
  cursor: 'pointer',
  marginBottom: '-1px',
  transition: 'border-bottom-color 0.15s',

  '&:first-child': {
    borderLeft: `1px solid ${theme.border}`,
  },
}));

export const AvatarButton = styled('button')(({ theme }) => ({
  width: theme.spacing(8),
  height: theme.spacing(8),
  borderRadius: '50%',
  background: theme.border,
  border: 'none',
  cursor: 'pointer',
  alignSelf: 'center',
  marginRight: theme.spacing(6),
}));
