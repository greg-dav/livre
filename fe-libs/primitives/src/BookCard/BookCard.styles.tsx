import styled from 'styled-components';

export const Spine = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.accent,
  writingMode: 'vertical-lr' as const,
  userSelect: 'none' as const,
  width: 0,
  overflow: 'hidden',
  transition: 'width 0.3s ease',
}));

export const Card = styled('article')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  cursor: 'pointer',
}));

export const Cover = styled('div')<{ $color: string; $inLibrary?: boolean }>(
  ({ $color, $inLibrary, theme }) => ({
    position: 'relative',
    width: '100%',
    aspectRatio: '2 / 3',
    backgroundColor: $color,
    borderRadius: '3px 6px 6px 3px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: $inLibrary
      ? `0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px ${theme.accent}`
      : '0 2px 8px rgba(0,0,0,0.2)',
    [`&:hover ${Spine}`]: {
      width: theme.spacing(4),
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background:
        'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 47%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.06) 53%, transparent 65%)',
      mixBlendMode: 'screen' as const,
      pointerEvents: 'none' as const,
      transform: 'translateX(-120%)',
    },
    '&:hover::after': {
      animation: $inLibrary ? 'cover-shimmer 0.7s ease-in-out forwards' : 'none',
    },
  })
);

export const FaceImage = styled('img')<{ $loaded: boolean }>(({ $loaded }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  opacity: $loaded ? 1 : 0,
  transition: 'opacity 0.2s ease',
}));

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
  // Pin to two columns on phones — the 155px min would otherwise drop to one column on narrow screens.
  [theme.media.mobile]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: `${theme.spacing(6)} ${theme.spacing(4)}`,
  },
}));
