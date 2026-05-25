import type { ElementType, ReactNode } from 'react';
import { StyledText, type TextVariant, type TextColor } from './Text.styles';

export type { TextVariant, TextColor };

const defaultElement: Record<TextVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  'ui-lg': 'span',
  'ui-md': 'span',
  'ui-sm': 'span',
  'ui-tight': 'span',
  'ui-xs': 'span',
  label: 'span',
  mono: 'span',
};

export interface TextProps {
  variant: TextVariant;
  color?: TextColor;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * The single source of truth for all typography. Every string rendered in the UI must go through
 * this component — never set font-family, font-size, or font-weight in a styles file. The variant
 * encodes both the visual role and the correct semantic element; use `as` only when the semantics
 * must differ from the visual (e.g. an h3-styled subheading inside an already-h2 section).
 */
export const Text = ({
  variant,
  color = 'default',
  as,
  children,
  className,
  onClick,
}: TextProps) => (
  <StyledText
    as={as ?? defaultElement[variant]}
    $variant={variant}
    $color={color}
    className={className}
    onClick={onClick}
  >
    {children}
  </StyledText>
);
