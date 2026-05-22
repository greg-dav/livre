import styled from 'styled-components';

export const AccentPeriod = styled('span')(({ theme }) => ({
  color: theme.accent,
}));

export const Wordmark = styled('span')({
  cursor: 'pointer',
  userSelect: 'none',
});
