import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle(({ theme }) => ({
  '*, *::before, *::after': {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  html: {
    fontSize: '16px',
    WebkitFontSmoothing: 'antialiased',
  },
  body: {
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily: theme.fontUi,
    minHeight: '100dvh',
    transition: 'background-color 0.2s, color 0.2s',
  },
}));

export default GlobalStyle;
