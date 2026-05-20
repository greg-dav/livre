import type { DefaultTheme } from 'styled-components'

const shared = {
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'Lora', Georgia, serif",
  fontUi: "'Outfit', system-ui, sans-serif",
}

export const lightTheme: DefaultTheme = {
  ...shared,
  bg: '#F7F5F0',
  bgSurface: '#EFEDE7',
  text: '#1A1917',
  textMuted: '#6B6860',
  accent: '#A67C00',
  border: '#DDD9D0',
}

export const darkTheme: DefaultTheme = {
  ...shared,
  bg: '#13120F',
  bgSurface: '#1E1C18',
  text: '#EDE9E0',
  textMuted: '#8A8780',
  accent: '#C9980A',
  border: '#2E2C27',
}
