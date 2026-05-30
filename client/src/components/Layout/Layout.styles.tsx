import styled from 'styled-components';

export const Page = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
  background: theme.bg,
}));

export const Main = styled('div')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

export const Header = styled('header')(({ theme }) => ({
  position: 'relative',
  zIndex: 100,
  flexShrink: 0,
  display: 'grid',
  // Equal side tracks keep the search centred in the header regardless of breadcrumb length;
  // minmax(0,…) lets a long title truncate instead of pushing the centre off-axis.
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  columnGap: theme.spacing(4),
  height: theme.spacing(13),
  padding: `0 ${theme.spacing(7)}`,
  borderBottom: `1px solid ${theme.borderSoft}`,
  background: theme.bg,
}));

export const HeaderLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  minWidth: 0,
}));

export const HeaderDivider = styled('span')(({ theme }) => ({
  width: '1px',
  height: theme.spacing(5),
  background: theme.borderSoft,
  flexShrink: 0,
}));

export const SearchSlot = styled('div')({
  width: '300px',
  maxWidth: '100%',
  display: 'flex',
});

export const HeaderRight = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
});

// A long title truncates with an ellipsis rather than wrapping or shoving the search off-centre.
export const HeaderTitle = styled('div')({
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

// Scroll lives on the body, not the window — the shell itself is fixed-height. Full-width screens
// (the Library split) manage their own internal panel scrolling, so the body just clips.
export const Body = styled('div')<{ $fullWidth?: boolean }>(({ $fullWidth }) =>
  $fullWidth
    ? { flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }
    : { flex: 1, minHeight: 0, overflowY: 'auto' }
);

export const Content = styled('main')<{ $focusMode?: boolean }>(({ theme, $focusMode }) => ({
  maxWidth: $focusMode ? '1240px' : '1320px',
  margin: '0 auto',
  padding: `${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(8),
  transition: 'max-width 0.25s ease',
}));

export const BackButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  // Padded hit-zone with a compensating negative margin: the button stays visually flush with the
  // header edge while the cursor-pointer area extends past the glyph bounds, so nudging the pointer
  // slightly off the text no longer drops the hover state.
  padding: theme.spacing(2),
  margin: theme.spacing(-2),
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexShrink: 0,
  '& span': {
    color: theme.textMuted,
    transition: 'color 0.15s',
  },
  '&:hover span': {
    color: theme.text,
  },
}));
