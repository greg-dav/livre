import styled from 'styled-components';

export const Row = styled('span')({
  display: 'inline-flex',
  gap: '1px',
  lineHeight: 1,
});

export const Star = styled('span')<{ $filled: boolean }>(({ theme, $filled }) => ({
  fontSize: '0.8125rem',
  color: $filled ? theme.accent : theme.border,
}));
