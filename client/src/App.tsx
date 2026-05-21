import { useState } from 'react';
import { LivreThemeProvider, type ThemeName } from '@livre/ui';
import { Library } from './screens';

export const App = () => {
  const [theme, setTheme] = useState<ThemeName>('roman-light');

  return (
    <LivreThemeProvider theme={theme}>
      <Library
        onToggleTheme={() => setTheme((t) => (t === 'roman-light' ? 'roman-dark' : 'roman-light'))}
      />
    </LivreThemeProvider>
  );
};
