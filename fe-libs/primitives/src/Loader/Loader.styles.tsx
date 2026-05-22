import styled, { createGlobalStyle } from 'styled-components';

// keyframes objects cannot be interpolated in object-syntax styled components in v6 — they must
// live in a css`` or createGlobalStyle`` tagged literal. Reference the animation by its stable name.
export const LoaderKeyframes = createGlobalStyle`
  @keyframes livre-spin {
    to { transform: rotate(360deg); }
  }
`;

export const Ring = styled('div')(({ theme }) => ({
  width: theme.spacing(8),
  height: theme.spacing(8),
  borderRadius: '50%',
  border: `2px solid ${theme.border}`,
  borderTopColor: theme.accent,
  animation: 'livre-spin 0.65s linear infinite',
  flexShrink: 0,
}));

// Standalone — centers the spinner; flex: 1 fills available space in flex column layouts
export const Fill = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
});

// Overlay — dims content and positions the spinner above it
export const Relative = styled('div')<{ $loading: boolean }>(({ $loading }) => ({
  position: 'relative',
  opacity: $loading ? 0.4 : 1,
  transition: 'opacity 0.2s',
  pointerEvents: $loading ? 'none' : undefined,
}));

export const Overlay = styled('div')({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
});
