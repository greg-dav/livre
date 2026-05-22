import { createGlobalStyle } from 'styled-components';

/**
 * Global CSS rules owned by @livre/primitives. Must be rendered once inside LivreThemeProvider.
 * Defines keyframes used by primitive components so @livre/ui doesn't need to know about them.
 */
export const PrimitivesGlobalStyle = createGlobalStyle({
  '@keyframes cover-shimmer': {
    from: { transform: 'translateX(-120%)' },
    to: { transform: 'translateX(120%)' },
  },
});
