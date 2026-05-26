import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    bg: string;
    bgElevated: string;
    bgSunken: string;
    text: string;
    textMuted: string;
    textOnColor: string;
    textOnColorMuted: string;
    textOnDark: string;
    textOnDarkMuted: string;
    accent: string;
    accentSoft: string;
    border: string;
    borderSoft: string;
    fontDisplay: string;
    fontBody: string;
    fontUi: string;
    fontMono: string;
    spacing: (n: number) => string;
    radius: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
  }
}
