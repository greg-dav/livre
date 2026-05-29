import styled from 'styled-components';

export const Row = styled('span')({
  display: 'inline-flex',
  gap: '1px',
  lineHeight: 1,
});

export const StarWrapper = styled('span')({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8125rem',
  lineHeight: 1,
});

export const StarGlyph = styled('span')<{ $fill: 'full' | 'half' | 'empty' }>(
  ({ theme, $fill }) => ({
    position: 'relative',
    color: $fill === 'empty' ? theme.border : theme.accent,
    userSelect: 'none',
    ...($fill === 'half' && {
      color: theme.border,
      '&::before': {
        content: '"★"',
        position: 'absolute',
        left: 0,
        top: 0,
        color: theme.accent,
        width: '50%',
        overflow: 'hidden',
        display: 'block',
      },
    }),
  })
);

export const HalfButton = styled('button')<{ $side: 'left' | 'right' }>(({ $side }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  [$side]: 0,
  width: '50%',
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  opacity: 0,
}));
