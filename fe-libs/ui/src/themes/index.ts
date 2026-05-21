import type { DefaultTheme } from 'styled-components';
import { romanLight, romanDark } from './roman';

export type ColorScheme = 'light' | 'dark';

export interface ThemeDefinition {
  label: string;
  colorScheme: ColorScheme;
  tokens: DefaultTheme;
}

export const themes = {
  'roman-light': {
    label: 'Roman Light',
    colorScheme: 'light',
    tokens: romanLight,
  },
  'roman-dark': {
    label: 'Roman Dark',
    colorScheme: 'dark',
    tokens: romanDark,
  },
} satisfies Record<string, ThemeDefinition>;

export type ThemeName = keyof typeof themes;
