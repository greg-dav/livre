import styled, { createGlobalStyle } from 'styled-components';

// keyframes objects cannot be interpolated in object-syntax styled components in v6 — they must
// live in a css`` or createGlobalStyle`` tagged literal. Reference the animation by its stable name.
export const ProgressKeyframes = createGlobalStyle`
  @keyframes livre-progress-indeterminate {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }
`;

export const Track = styled('div')(({ theme }) => ({
  width: '100%',
  height: '3px',
  background: theme.border,
  borderRadius: '2px',
  overflow: 'hidden',
}));

export const Fill = styled('div')<{ $value: number }>(({ theme, $value }) => ({
  height: '100%',
  width: `${Math.min(100, Math.max(0, $value))}%`,
  background: theme.accent,
  borderRadius: '2px',
}));

// A short segment that sweeps across the track on a loop, for operations with no measurable
// progress (e.g. a network round-trip). Width is a fraction of the track so the slide reads clearly.
export const IndeterminateFill = styled('div')(({ theme }) => ({
  height: '100%',
  width: '40%',
  background: theme.accent,
  borderRadius: '2px',
  animation: 'livre-progress-indeterminate 1.1s ease-in-out infinite',
}));
