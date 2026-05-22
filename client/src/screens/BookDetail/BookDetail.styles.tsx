import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Hero = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(8),
  alignItems: 'flex-start',
}));

export const Cover = styled('img')({
  width: '128px',
  aspectRatio: '2 / 3',
  objectFit: 'cover',
  borderRadius: '4px',
  flexShrink: 0,
});

export const CoverPlaceholder = styled('div')(({ theme }) => ({
  width: '128px',
  aspectRatio: '2 / 3',
  borderRadius: '4px',
  flexShrink: 0,
  background: theme.bgSurface,
  border: `1px solid ${theme.border}`,
}));

export const HeroMeta = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

export const AuthorList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${theme.spacing(1)} ${theme.spacing(3)}`,
}));

export const AuthorLink = styled(Link)(({ theme }) => ({
  color: theme.accent,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

export const Byline = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `0 ${theme.spacing(2)}`,
  alignItems: 'center',
}));

export const Dot = styled('span')(({ theme }) => ({
  color: theme.textMuted,
  userSelect: 'none',
}));

export const Divider = styled('hr')(({ theme }) => ({
  border: 'none',
  borderTop: `1px solid ${theme.border}`,
  margin: 0,
}));

export const Description = styled('div')({
  maxWidth: '680px',
});

export const MetaGrid = styled('dl')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: theme.spacing(6),
  rowGap: theme.spacing(2),
  maxWidth: '480px',
}));

export const MetaLabel = styled('dt')(({ theme }) => ({
  color: theme.textMuted,
}));

export const MetaValue = styled('dd')({
  margin: 0,
});
