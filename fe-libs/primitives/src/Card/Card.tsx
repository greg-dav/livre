import styled from 'styled-components';

/**
 * General-purpose surface container. Use wherever content needs to be visually grouped and lifted
 * off the page background — auth panels, settings sections, dialog bodies. Apply width constraints
 * from the outside; Card itself is unconstrained.
 */
export const Card = styled('div')(({ theme }) => ({
  background: theme.bgSurface,
  border: `1px solid ${theme.border}`,
  borderRadius: '6px',
  padding: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
}));

/**
 * Optional header section inside a Card. Separates a title and subtitle from the card's main
 * content with a tighter gap than the card's overall gap.
 */
export const CardHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));
