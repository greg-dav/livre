import styled from 'styled-components';

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
