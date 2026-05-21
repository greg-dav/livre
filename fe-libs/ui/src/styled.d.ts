import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    bg: string;
    bgSurface: string;
    text: string;
    textMuted: string;
    textOnColor: string;
    textOnColorMuted: string;
    accent: string;
    border: string;
    fontDisplay: string;
    fontBody: string;
    fontUi: string;
    spacing: (n: number) => string;
  }
}
