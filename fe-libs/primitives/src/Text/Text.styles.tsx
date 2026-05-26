import styled from 'styled-components';
import type { DefaultTheme } from 'styled-components';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'ui-lg'
  | 'ui-md'
  | 'ui-sm'
  | 'ui-tight'
  | 'ui-xs'
  | 'label'
  | 'mono';

export type TextColor =
  | 'default'
  | 'muted'
  | 'accent'
  | 'onColor'
  | 'onColorMuted'
  | 'onDark'
  | 'onDarkMuted';

const variantStyles = (variant: TextVariant, theme: DefaultTheme) => {
  const display = {
    fontFamily: theme.fontDisplay,
    fontStyle: 'italic' as const,
    fontWeight: 500,
    letterSpacing: '-0.01em',
  };
  const body = { fontFamily: theme.fontBody, fontWeight: 400 };
  const ui = { fontFamily: theme.fontUi };

  switch (variant) {
    case 'h1':
      return { ...display, fontSize: '3rem', lineHeight: 1.1 };
    case 'h2':
      return { ...display, fontSize: '2.5rem', lineHeight: 1.15 };
    case 'h3':
      return { ...display, fontSize: '1.875rem', lineHeight: 1.2 };
    case 'h4':
      return { ...display, fontSize: '1.5rem', lineHeight: 1.25 };
    case 'h5':
      return { ...display, fontSize: '1.25rem', lineHeight: 1.3 };
    case 'h6':
      return { ...display, fontSize: '1rem', lineHeight: 1.35 };
    case 'body1':
      return { ...body, fontSize: '1.0625rem', lineHeight: 1.75 };
    case 'body2':
      return { ...body, fontSize: '0.9375rem', lineHeight: 1.65 };
    case 'ui-lg':
      return { ...ui, fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 };
    case 'ui-md':
      return { ...ui, fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.5 };
    case 'ui-sm':
      return { ...ui, fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4 };
    case 'ui-tight':
      return { ...ui, fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4 };
    case 'ui-xs':
      return { ...ui, fontSize: '0.6875rem', fontWeight: 400, lineHeight: 1.4 };
    case 'label':
      return {
        ...ui,
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        lineHeight: 1.4,
      };
    case 'mono':
      return {
        fontFamily: theme.fontMono,
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.4,
      };
  }
};

const colorValue = (color: TextColor, theme: DefaultTheme): string =>
  ({
    default: theme.text,
    muted: theme.textMuted,
    accent: theme.accent,
    onColor: theme.textOnColor,
    onColorMuted: theme.textOnColorMuted,
    onDark: theme.textOnDark,
    onDarkMuted: theme.textOnDarkMuted,
  })[color];

export const StyledText = styled('span')<{ $variant: TextVariant; $color: TextColor }>(
  ({ theme, $variant, $color }) => ({
    ...variantStyles($variant, theme),
    color: colorValue($color, theme),
    margin: 0,
  })
);
