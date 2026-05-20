import { useState } from 'react'
import { ThemeProvider, createGlobalStyle, styled } from 'styled-components'
import { lightTheme, darkTheme } from './theme'

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  body {
    background-color: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-family: ${({ theme }) => theme.fontUi};
    min-height: 100dvh;
    transition: background-color 0.2s, color 0.2s;
  }
`

const Wordmark = styled.h1`
  font-family: ${({ theme }) => theme.fontDisplay};
  font-style: italic;
  font-weight: 400;
  font-size: 3rem;
  color: ${({ theme }) => theme.text};
`

const Wrapper = styled.main`
  padding: 2rem;
`

export default function App() {
  const [dark, setDark] = useState(false)

  return (
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Wrapper>
        <Wordmark>Livre</Wordmark>
        <button onClick={() => setDark(d => !d)} style={{ marginTop: '1rem' }}>
          Toggle theme
        </button>
      </Wrapper>
    </ThemeProvider>
  )
}
