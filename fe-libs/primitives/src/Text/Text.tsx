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
  'ui-xs': 'span',
  label: 'span',
};

export interface TextProps {
  variant: TextVariant;
  color?: TextColor;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

/**
 * Text
 *
 * The single source of truth for all typography — font family, size, and weight.
 * Never reference these properties directly in component or styles files.
 *
 * Heading variants (h1–h6): Cormorant Garamond, italic.
 * Body variants (body1, body2): Lora. body1 is the larger leading size.
 * UI variants (ui-lg, ui-md, ui-sm, ui-xs): Outfit.
 * label: Outfit, small, bold, uppercase — for eyebrow labels and tab copy.
 *
 * Renders the semantically correct element by default.
 * Use `as` to override (e.g. render h3 style as a <p>).
 *
 * @example
 * <Text variant="h3">Blood Meridian</Text>
 * <Text variant="body1" color="muted">A novel by Cormac McCarthy</Text>
 * <Text variant="label" color="accent">Currently Reading</Text>
 * <Text variant="ui-xs" color="onColor" as="span">Hemingway</Text>
 */
export const Text = ({ variant, color = 'default', as, children, className }: TextProps) => (
  <StyledText
    as={as ?? defaultElement[variant]}
    $variant={variant}
    $color={color}
    className={className}
  >
    {children}
  </StyledText>
);
