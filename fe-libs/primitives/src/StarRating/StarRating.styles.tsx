import styled from 'styled-components';

export const Row = styled('span')({
  display: 'inline-flex',
  gap: '1px',
  lineHeight: 1,
});

export const Star = styled('span')<{ $fill: 'full' | 'half' | 'empty' }>(({ theme, $fill }) => ({
  position: 'relative',
  fontSize: '0.8125rem',
  color: $fill === 'empty' ? theme.border : theme.accent,
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
}));
