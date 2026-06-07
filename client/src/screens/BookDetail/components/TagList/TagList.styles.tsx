import styled from 'styled-components';

export const TagRow = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  maxWidth: '680px',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

export const RemoveButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  // Padded hit-zone with a compensating negative margin: the glyph stays visually tucked against the
  // tag while the tap target extends past it, so it's hittable on touch without distorting the pill.
  // Larger on mobile, where there's no cursor precision.
  padding: theme.spacing(2),
  margin: theme.spacing(-2),
  [theme.media.mobile]: {
    padding: theme.spacing(2.5),
    margin: theme.spacing(-2.5),
  },
  background: 'none',
  border: 'none',
  lineHeight: 1,
  color: theme.textMuted,
  cursor: 'pointer',
  transition: 'color 0.15s',
  '&:hover': {
    color: theme.text,
  },
  '&:active': {
    color: theme.text,
  },
}));

export const AddPill = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: `${theme.spacing(1)} ${theme.spacing(2.5)}`,
  border: `1px dashed ${theme.border}`,
  borderRadius: theme.radius.full,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  '&:hover': {
    borderColor: theme.textMuted,
  },
}));

// CSS grid trick: ::after mirrors the input value so the grid cell is exactly as wide as
// the content. The input fills that same cell. Font must cascade from a <Text> parent so
// both the ghost and the real input measure identically.
export const AddSizer = styled('span')(({ theme }) => ({
  display: 'inline-grid',
  '&::after': {
    content: 'attr(data-value)',
    visibility: 'hidden',
    whiteSpace: 'pre',
    padding: `${theme.spacing(1)} ${theme.spacing(2.5)}`,
    border: '1px solid transparent',
    gridArea: '1 / 1',
    pointerEvents: 'none',
  },
  '& > input': {
    gridArea: '1 / 1',
    minWidth: 0,
  },
}));

// Ghost completion: sits in the same grid cell as the input, painted underneath. The typed
// prefix is rendered transparent so it aligns under the real input text; only the suffix shows
// through (the input's background is transparent). Padding/border must match AddInput exactly.
export const AddGhost = styled('span')(({ theme }) => ({
  gridArea: '1 / 1',
  padding: `${theme.spacing(1)} ${theme.spacing(2.5)}`,
  border: '1px solid transparent',
  whiteSpace: 'pre',
  pointerEvents: 'none',
  color: theme.textMuted,
  '& > span': {
    color: 'transparent',
  },
}));

export const AddInput = styled('input')(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(2.5)}`,
  border: `1px dashed ${theme.accent}`,
  borderRadius: theme.radius.full,
  background: 'transparent',
  outline: 'none',
  font: 'inherit',
  color: theme.text,
  '&::placeholder': {
    color: theme.textMuted,
  },
}));
