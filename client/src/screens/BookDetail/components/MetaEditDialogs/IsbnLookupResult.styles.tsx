import styled from 'styled-components';

export const ResultCard = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  padding: theme.spacing(4),
  background: theme.bgElevated,
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.borderSoft}`,
}));

export const ResultCover = styled('img')({
  width: '48px',
  height: '72px',
  objectFit: 'cover',
  borderRadius: '2px',
  flexShrink: 0,
});

export const ResultMeta = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  minWidth: 0,
}));

export const ResultActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
}));
