import styled from 'styled-components';

type PillVariant = 'default' | 'ghost';

interface PillRootProps {
  $variant: PillVariant;
}

const PillRoot = styled('span')<PillRootProps>(({ theme, $variant }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: `${theme.spacing(1)} ${theme.spacing(2.5)}`,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.full,
  background: $variant === 'ghost' ? 'transparent' : theme.bgElevated,
  borderStyle: $variant === 'ghost' ? 'dashed' : 'solid',
  transition: 'border-color 0.15s ease, background 0.15s ease',
  cursor: 'default',

  '&:hover': {
    borderColor: theme.textMuted,
  },
}));

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
}

/**
 * Compact rounded tag for categorical metadata — book categories, user tags, filter chips. Ghost
 * variant carries a dashed border for "add new" affordances. The component owns its container
 * styling only; wrap content in <Text> for typography to keep the type scale consistent.
 */
export const Pill = ({ children, variant = 'default' }: PillProps) => (
  <PillRoot $variant={variant}>{children}</PillRoot>
);

export type { PillProps, PillVariant };
