import styled from 'styled-components';

export const Card = styled('article')<{ $clickable?: boolean }>(({ theme, $clickable }) => ({
  cursor: $clickable ? 'pointer' : 'default',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(5),
  background: 'transparent',
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.lg,
  padding: theme.spacing(5),
}));

export const CoverThumb = styled('div')<{ $color: string }>(({ $color, theme }) => ({
  width: '64px',
  height: '96px',
  background: $color,
  borderRadius: theme.radius.sm,
  flexShrink: 0,
  overflow: 'hidden',
}));

export const CoverThumbImg = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
});

export const Body = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3125rem',
  minWidth: 0,
});

export const ProgressSection = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(0.5),
}));

export const LogButton = styled('button')(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  flexShrink: 0,
  alignSelf: 'center',
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
  background: 'transparent',
  cursor: 'pointer',
  color: theme.textMuted,
  fontSize: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&:hover': {
    borderColor: theme.textMuted,
    color: theme.text,
  },
}));
