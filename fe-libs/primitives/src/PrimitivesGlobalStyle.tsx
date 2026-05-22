import { createGlobalStyle } from 'styled-components';

const COVER_DROP_SHADOW = '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)';

/**
 * Global CSS rules owned by @livre/primitives. Must be rendered once inside LivreThemeProvider.
 * Defines keyframes used by primitive components and screens so @livre/ui doesn't need to know
 * about them. Uses tagged template syntax (not object syntax) because styled-components misparses
 * `@keyframes` blocks in object form when the value contains multi-shadow strings — it leaks the
 * box-shadow declarations onto the global scope and every element gets the ring. Template literal
 * is the canonical form for createGlobalStyle and handles at-rules correctly.
 */
export const PrimitivesGlobalStyle = createGlobalStyle`
  @keyframes cover-shimmer {
    from { transform: translateX(-120%); }
    to { transform: translateX(120%); }
  }

  @keyframes cover-acquire {
    from {
      box-shadow: 0 0 0 0 ${({ theme }) => theme.accent}, ${COVER_DROP_SHADOW};
    }
    to {
      box-shadow: 0 0 0 2px ${({ theme }) => theme.accent}, ${COVER_DROP_SHADOW};
    }
  }
`;
