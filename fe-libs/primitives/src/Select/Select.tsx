import styled from 'styled-components';
import * as Radix from '@radix-ui/react-select';
import { Text } from '../Text/Text';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

const Trigger = styled(Radix.Trigger)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  width: '100%',
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.sm,
  color: theme.text,
  font: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 0.15s',

  '&:focus, &[data-state="open"]': {
    borderColor: theme.accent,
    boxShadow: `0 0 0 3px ${theme.accentSoft}`,
  },

  '&[data-placeholder]': {
    color: theme.textMuted,
  },
}));

const Chevron = styled('span')(({ theme }) => ({
  color: theme.textMuted,
  fontSize: '0.75rem',
  flexShrink: 0,
  '[data-state="open"] &': {
    transform: 'rotate(180deg)',
  },
  transition: 'transform 0.15s',
}));

const Content = styled(Radix.Content)(({ theme }) => ({
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
  padding: theme.spacing(1),
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  zIndex: 300,
  maxHeight: theme.spacing(72),
  overflowY: 'auto',
  width: 'var(--radix-select-trigger-width)',
}));

const Item = styled(Radix.Item)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  borderRadius: theme.radius.sm,
  cursor: 'pointer',
  outline: 'none',
  userSelect: 'none',

  '&[data-highlighted]': {
    background: theme.accentSoft,
    color: theme.text,
  },

  '&[data-state="checked"]': {
    color: theme.accent,
  },
}));

/**
 * Single-select dropdown backed by Radix Select. Renders a styled trigger button and a portal
 * content list. The trigger inherits font from its parent via `font: inherit` so the text scale
 * stays consistent without referencing tokens directly. Controlled only — pass value and
 * onValueChange. Use SelectOption[] for the options list.
 */
export const Select = ({ value, onValueChange, options, placeholder }: SelectProps) => (
  <Radix.Root value={value} onValueChange={onValueChange}>
    <Trigger>
      <Radix.Value placeholder={placeholder ?? 'Select…'} />
      <Radix.Icon asChild>
        <Chevron>▾</Chevron>
      </Radix.Icon>
    </Trigger>
    <Radix.Portal>
      <Content position="popper" sideOffset={4}>
        <Radix.Viewport>
          {options.map((opt) => (
            <Item key={opt.value} value={opt.value}>
              <Radix.ItemText>
                <Text variant="ui-sm">{opt.label}</Text>
              </Radix.ItemText>
            </Item>
          ))}
        </Radix.Viewport>
      </Content>
    </Radix.Portal>
  </Radix.Root>
);

export type { SelectProps };
