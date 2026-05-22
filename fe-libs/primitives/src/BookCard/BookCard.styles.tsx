import styled from 'styled-components';

export const Card = styled('article')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  cursor: 'pointer',
}));

export const Cover = styled('div')<{ $color: string }>(({ $color }) => ({
  width: '100%',
  aspectRatio: '2 / 3',
  backgroundColor: $color,
  borderRadius: '3px 6px 6px 3px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
}));

export const FaceImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
});

export const Face = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  gap: theme.spacing(1),
  textAlign: 'center' as const,
}));

export const Meta = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const BookGrid = styled('section')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
  gap: `${theme.spacing(7)} ${theme.spacing(5)}`,
}));
