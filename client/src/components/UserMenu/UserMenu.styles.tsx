import styled from 'styled-components';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const Trigger = styled('button')(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  border: `1px solid ${theme.border}`,
  borderRadius: '50%',
  background: 'transparent',
  cursor: 'pointer',
  color: theme.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&:hover': {
    borderColor: theme.textMuted,
  },
}));

export const Content = styled(DropdownMenu.Content)(({ theme }) => ({
  minWidth: theme.spacing(40),
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: '8px',
  padding: theme.spacing(1),
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
}));

export const Item = styled(DropdownMenu.Item)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  borderRadius: '6px',
  cursor: 'pointer',
  outline: 'none',

  '&[data-highlighted]': {
    background: theme.bgSurface,
  },
}));

export const Separator = styled(DropdownMenu.Separator)(({ theme }) => ({
  height: '1px',
  background: theme.border,
  margin: theme.spacing(1),
}));
