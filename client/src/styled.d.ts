import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    bg: string
    bgSurface: string
    text: string
    textMuted: string
    accent: string
    border: string
    fontDisplay: string
    fontBody: string
    fontUi: string
  }
}
