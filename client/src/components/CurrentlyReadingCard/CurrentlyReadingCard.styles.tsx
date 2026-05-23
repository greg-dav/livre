import styled from 'styled-components';

export const Card = styled('article')<{ $clickable?: boolean }>(({ theme, $clickable }) => ({
  cursor: $clickable ? 'pointer' : 'default',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.lg,
  padding: theme.spacing(3.5),
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',

  '&:hover': $clickable
    ? {
        borderColor: theme.accent,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
      }
    : undefined,
}));

export const MainRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
}));

export const CoverThumb = styled('div')<{ $color: string }>(({ $color, theme }) => ({
  width: '48px',
  height: '72px',
  background: $color,
  borderRadius: '2px 4px 4px 2px',
  flexShrink: 0,
  overflow: 'hidden',
  boxShadow: `0 2px 6px rgba(0,0,0,0.25), 0 0 0 2px ${theme.accent}`,
}));

export const CoverThumbImg = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
});

export const Body = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

export const SinceRow = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}));

export const PulseDot = styled('span')(({ theme }) => ({
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  background: theme.accent,
  boxShadow: `0 0 0 2px ${theme.accentSoft}`,
  flexShrink: 0,
  display: 'inline-block',
}));

export const Actions = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  borderTop: `1px solid ${theme.borderSoft}`,
  paddingTop: theme.spacing(2),
}));

export const ActionBtn = styled('button')(({ theme }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  color: theme.textMuted,
  border: `1px solid ${theme.border}`,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'color 0.15s, background 0.15s, border-color 0.15s',

  '&:hover': {
    color: theme.accent,
    background: theme.accentSoft,
    borderColor: theme.accent,
  },
}));
