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
  // In iOS standalone the header sits under the translucent status bar; grow the bar by the top
  // inset and pad by it so the bar fills the notch area while its content keeps its natural height.
  // The inset is 0 in the browser and on non-notched devices, so this is a no-op there.
  height: `calc(${theme.spacing(13)} + env(safe-area-inset-top))`,
  paddingTop: 'env(safe-area-inset-top)',
  paddingLeft: theme.spacing(7),
  paddingRight: theme.spacing(7),
  borderBottom: `1px solid ${theme.borderSoft}`,
  background: theme.bg,
  [theme.media.mobile]: {
    // Search slot + trailing track are hidden on mobile, so the header is a single full-width track
    // — the contextual bar (or title) gets the whole row instead of being boxed into the left third.
    gridTemplateColumns: '1fr',
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
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
  // The title it separates is hidden on mobile detail pages, so the divider would dangle — drop it.
  [theme.media.mobile]: {
    display: 'none',
  },
}));

export const SearchSlot = styled('div')(({ theme }) => ({
  width: '300px',
  maxWidth: '100%',
  display: 'flex',
  // No header search on mobile — the Search nav tab is the entry point.
  [theme.media.mobile]: {
    display: 'none',
  },
}));

export const HeaderRight = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  // Empty on mobile — drop it so the single-track header gives all its width to the left content.
  [theme.media.mobile]: {
    display: 'none',
  },
}));

// A long title truncates with an ellipsis rather than wrapping or shoving the search off-centre.
// On detail pages (non-root) the title is hidden on mobile — it's already shown large in the hero,
// and the back button needs the full header width — while root pages keep their title.
export const HeaderTitle = styled('div')<{ $hideOnMobile?: boolean }>(
  ({ theme, $hideOnMobile }) => ({
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    ...($hideOnMobile && { [theme.media.mobile]: { display: 'none' } }),
  })
);

// Scroll lives on the body, not the window — the shell itself is fixed-height. Full-width screens
// (the Library split) manage their own internal panel scrolling, so the body just clips. On mobile
// that inverts: the body becomes one scrolling column for every screen, with bottom clearance for
// the fixed BottomNav.
export const Body = styled('div')<{ $fullWidth?: boolean }>(({ theme, $fullWidth }) => ({
  flex: 1,
  minHeight: 0,
  ...($fullWidth ? { display: 'flex', overflow: 'hidden' } : { overflowY: 'auto' }),
  [theme.media.mobile]: {
    display: 'block',
    overflowX: 'hidden',
    overflowY: 'auto',
    paddingBottom: theme.spacing(12),
  },
}));

export const Content = styled('main')<{ $focusMode?: boolean }>(({ theme, $focusMode }) => ({
  maxWidth: $focusMode ? '1240px' : '1320px',
  margin: '0 auto',
  padding: `${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(8),
  transition: 'max-width 0.25s ease',
  [theme.media.mobile]: {
    padding: `${theme.spacing(5)} ${theme.spacing(4)}`,
    gap: theme.spacing(6),
  },
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
  // On mobile the verbose "Back to …" is replaced by the compact MobileContext bar below.
  [theme.media.mobile]: {
    display: 'none',
  },
}));

// Mobile-only contextual header for detail pages: a slim back chevron, an optional cover thumbnail,
// and the title + subtitle (author). Replaces the desktop "Back to …" + title, giving the modern
// app feel; the browser's edge-swipe still works as a bonus on top of the visible control.
export const MobileContext = styled('div')(({ theme }) => ({
  display: 'none',
  [theme.media.mobile]: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2.5),
    minWidth: 0,
  },
}));

export const ContextBack = styled('button')(({ theme }) => ({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  margin: `${theme.spacing(-1)} 0`,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: theme.textMuted,
  '&:active': { color: theme.text },
}));

export const ContextCover = styled('div')(({ theme }) => ({
  flexShrink: 0,
  width: theme.spacing(6),
  height: theme.spacing(9),
  borderRadius: '2px 3px 3px 2px',
  boxShadow: '1px 1px 4px rgba(0,0,0,0.22)',
  background: theme.bgSunken,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

export const ContextText = styled('div')({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  // Pull the subtitle up to close the line-box leading between the two stacked labels.
  '& > * + *': {
    marginTop: '-3px',
  },
});

// Single truncating line — overflow clips on this block while the Text inside keeps its own styling.
export const ContextLine = styled('span')({
  display: 'block',
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});
