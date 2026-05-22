import styled from 'styled-components';

export const Container = styled('div')({
  position: 'relative',
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
});

export const Dropdown = styled('ul')(({ theme }) => ({
  position: 'absolute',
  top: `calc(100% + ${theme.spacing(2)})`,
  left: 0,
  right: 0,
  zIndex: 50,
  background: theme.bgSurface,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.spacing(2),
  padding: `${theme.spacing(1)} 0`,
  margin: 0,
  listStyle: 'none',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  maxHeight: '480px',
  overflowY: 'auto',
}));

export const ResultItem = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  cursor: 'pointer',
  '&:hover': {
    background: theme.bg,
  },
}));

export const Thumbnail = styled('img')({
  width: '32px',
  height: '48px',
  objectFit: 'cover',
  borderRadius: '2px',
  flexShrink: 0,
});

export const ThumbnailPlaceholder = styled('div')(({ theme }) => ({
  width: '32px',
  height: '48px',
  borderRadius: '2px',
  flexShrink: 0,
  background: theme.border,
}));

export const ResultInfo = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: 1,
  overflow: 'hidden',
});

export const StatusRow = styled('li')(({ theme }) => ({
  padding: `${theme.spacing(3)} ${theme.spacing(3)}`,
  textAlign: 'center',
}));
