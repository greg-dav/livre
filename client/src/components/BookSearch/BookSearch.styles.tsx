import styled from 'styled-components';
import { Input } from '@livre/primitives';

export const Container = styled('div')({
  position: 'relative',
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
});

/*
 * Top-bar search is visually distinct from form inputs — it's app chrome, a pill-shaped surface
 * that sits on the page bg, not inside a card. Lighter (bgElevated) and rounder (radius.lg) than
 * the default <Input>. Font properties set explicitly here because <input> elements can't compose
 * <Text> internally — bounded exception to the no-fontFamily-outside-Text rule, justified by the
 * primitive being at the typography boundary.
 */
export const SearchInput = styled(Input)(({ theme }) => ({
  background: theme.bgElevated,
  borderRadius: theme.radius.lg,
  padding: `${theme.spacing(2.5)} ${theme.spacing(4.5)}`,
  fontFamily: theme.fontUi,
  fontSize: '0.9375rem',
  '&::placeholder': {
    color: theme.textMuted,
    opacity: 1,
  },
}));

export const Dropdown = styled('ul')(({ theme }) => ({
  position: 'absolute',
  top: `calc(100% + ${theme.spacing(2)})`,
  left: 0,
  right: 0,
  zIndex: 50,
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
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

export const SectionLabel = styled('li')(({ theme }) => ({
  padding: `${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(1)}`,
}));

export const SectionDivider = styled('li')(({ theme }) => ({
  height: '1px',
  background: theme.border,
  margin: `${theme.spacing(1)} 0`,
}));

export const ShelfBadge = styled('span')(({ theme }) => ({
  padding: `0 ${theme.spacing(2)}`,
  borderRadius: theme.radius.sm,
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  flexShrink: 0,
}));
