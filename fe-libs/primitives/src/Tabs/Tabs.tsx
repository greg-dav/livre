import styled from 'styled-components';
import * as Radix from '@radix-ui/react-tabs';

const Root = Radix.Root;

const List = styled(Radix.List)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
}));

const Trigger = styled(Radix.Trigger)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: theme.textMuted,
  outline: 'none',

  '&[data-state="active"]': {
    color: theme.text,
    background: theme.bgSurface,
  },

  '&:focus-visible': {
    outline: `2px solid ${theme.accent}`,
    outlineOffset: '2px',
  },
}));

const Content = styled(Radix.Content)({
  '&:focus-visible': {
    outline: 'none',
  },
});

/**
 * Namespace for Radix Tabs pieces. Use Tabs.Root as the state container, Tabs.List for the tab
 * bar, Tabs.Trigger for each tab button (value prop must match Tabs.Content value), and
 * Tabs.Content for the panel body. Styled to match Livre's visual language.
 */
export const Tabs = { Root, List, Trigger, Content };
