import type { DefaultTheme } from 'styled-components';

const shared = {
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'Lora', Georgia, serif",
  fontUi: "'Outfit', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  spacing: (n: number) => `${n * 0.25}rem`,
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '999px',
  },
};

/*
 * textOnColor matches each theme's bg (cream in light, near-black in dark) — paired with the
 * gold accent on primary surfaces (buttons, BookCard spine). Echoes the prototype's
 * `color: var(--bg)` on `.btn.primary` and keeps the surface palette unified.
 */
export const romanLight: DefaultTheme = {
  ...shared,
  bg: '#F4EFE3',
  bgElevated: '#FAF5E9',
  bgSunken: '#ECDBB7',
  text: '#1A1815',
  textMuted: '#6B6860',
  textOnColor: '#F4EFE3',
  textOnColorMuted: 'rgba(244, 239, 227, 0.65)',
  border: '#D9D2C2',
  borderSoft: '#E6DFCE',
  accent: '#C99C3C',
  accentSoft: 'rgba(201, 156, 60, 0.12)',
};

export const romanDark: DefaultTheme = {
  ...shared,
  bg: '#13120F',
  bgElevated: '#1E1C18',
  bgSunken: '#0B0A08',
  text: '#EDE9E0',
  textMuted: '#8A8780',
  textOnColor: '#13120F',
  textOnColorMuted: 'rgba(19, 18, 15, 0.65)',
  border: '#2E2C27',
  borderSoft: '#232220',
  accent: '#D4A547',
  accentSoft: 'rgba(212, 165, 71, 0.18)',
};
