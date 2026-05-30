import styled from 'styled-components';

export const SectionHeadRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
}));

export const UserList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const UserRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.borderSoft}`,
  background: theme.bgElevated,
}));

export const RowLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  minWidth: 0,
}));

export const RowMeta = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

export const RowActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexShrink: 0,
}));

export const IconButton = styled('button')<{ $danger?: boolean }>(({ theme, $danger }) => ({
  width: theme.spacing(8),
  height: theme.spacing(8),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: theme.radius.sm,
  background: 'none',
  cursor: 'pointer',
  color: theme.textMuted,
  transition: 'background 0.15s, color 0.15s',
  '&:hover': {
    background: theme.bgSunken,
    color: $danger ? theme.accent : theme.text,
  },
  '&:disabled': {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
}));

export const DialogForm = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(5),
}));

export const DialogActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

export const FieldStack = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const AdminToggle = styled('button')<{ $on: boolean }>(({ theme, $on }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  padding: theme.spacing(1),
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  color: theme.text,
  '& > [data-box]': {
    width: theme.spacing(5),
    height: theme.spacing(5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    border: `1px solid ${$on ? theme.accent : theme.border}`,
    background: $on ? theme.accent : 'transparent',
    color: theme.textOnColor,
    transition: 'background 0.15s, border-color 0.15s',
  },
}));
