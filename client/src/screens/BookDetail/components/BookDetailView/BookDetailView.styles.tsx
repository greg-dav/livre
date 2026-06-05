import styled from 'styled-components';
import { Link } from 'react-router-dom';

/*
 * Two-column layout used when a journal slot is provided (library books only). The 380px right
 * column is fixed; the left absorbs the remainder. align-items: start keeps the journal at the
 * top instead of vertically centring against tall left content.
 */
export const LayoutGrid = styled('div')<{ $focusMode?: boolean }>(({ theme, $focusMode }) => ({
  display: 'grid',
  gridTemplateColumns: $focusMode ? '1fr' : '1fr 380px',
  gap: $focusMode ? 0 : theme.spacing(14),
  alignItems: 'start',
  // Single column on mobile — the journal card flows below the book info.
  [theme.media.mobile]: {
    gridTemplateColumns: '1fr',
    gap: $focusMode ? 0 : theme.spacing(8),
  },
}));

/*
 * Restores the vertical rhythm (Hero → Divider → DescriptionSection → Divider → MetaGrid) that
 * Layout's Content normally provides via flex gap. minWidth: 0 lets the column shrink so long
 * unbroken text doesn't blow out the grid.
 */
export const LeftColumn = styled('div')<{ $focusMode?: boolean }>(({ theme, $focusMode }) => ({
  display: $focusMode ? 'none' : 'flex',
  flexDirection: 'column',
  gap: theme.spacing(8),
  minWidth: 0,
}));

export const FocusStrip = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '56px 1fr auto',
  gap: '20px',
  alignItems: 'center',
  marginTop: theme.spacing(6),
  paddingBottom: '20px',
  marginBottom: '32px',
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

export const FocusStripCover = styled('div')({
  aspectRatio: '2/3',
  boxShadow: '0 0 0 2px var(--accent, #7b6f5c)',
  borderRadius: '3px',
  overflow: 'hidden',
  '& img': { width: '100%', height: '100%', objectFit: 'cover' },
});

// Wraps the FocusStrip accent ring using the theme token instead of the CSS variable fallback
export const FocusStripCoverThemed = styled('div')(({ theme }) => ({
  aspectRatio: '2/3',
  boxShadow: `0 0 0 2px ${theme.accent}`,
  borderRadius: '3px',
  overflow: 'hidden',
  '& img': { width: '100%', height: '100%', objectFit: 'cover' },
}));

export const FocusStripInfo = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const FocusStripSep = styled('span')({
  margin: '0 8px',
});

export const ExitFocusButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: '8px 16px',
  border: `1px solid ${theme.border}`,
  borderRadius: '8px',
  background: theme.bgElevated,
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s ease',
  '& span': { color: theme.text },
  '&:hover': { borderColor: theme.textMuted },
}));

export const Hero = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(10),
  alignItems: 'flex-start',
  marginTop: theme.spacing(6),
  [theme.media.mobile]: {
    gap: theme.spacing(5),
    marginTop: theme.spacing(2),
  },
}));

// Resting drop shadow that gives the cover physical presence — book on a shelf rather than image
// on a page. Layered with the accent ring when in library, and preserved through the acquire
// keyframes so the shadow doesn't disappear during the grab.
const coverDropShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)';

/*
 * Gradient overlay that fades in when the user hovers over the cover. The button inside it fires
 * the cover-change dialog. Pointer events pass through the gradient itself so only the button is
 * interactive; the overlay background doesn't block the Lightbox click in read-only mode.
 */
export const CoverEditOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)',
  opacity: 0,
  transition: 'opacity 0.15s ease',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  paddingBottom: theme.spacing(3),
  pointerEvents: 'none',
}));

export const CoverEditButton = styled('button')(({ theme }) => ({
  background: theme.bgElevated,
  border: 'none',
  borderRadius: theme.radius.sm,
  color: theme.text,
  cursor: 'pointer',
  padding: '6px 10px',
  transition: 'opacity 0.15s',
  pointerEvents: 'auto',
  '&:hover': { opacity: 0.88 },
}));

export const CoverWrapper = styled('div')<{ $inLibrary?: boolean; $justAcquired?: boolean }>(
  ({ $inLibrary, $justAcquired, theme }) => ({
    position: 'relative',
    flexShrink: 0,
    lineHeight: 0,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    cursor: 'pointer',
    isolation: 'isolate',
    background: theme.bgElevated,
    boxShadow: $inLibrary ? `0 0 0 2px ${theme.accent}, ${coverDropShadow}` : coverDropShadow,

    [`&:hover ${CoverEditOverlay}`]: { opacity: 1 },

    // Acquisition sequence: ring quietly slips out from the cover's edge (200ms), then a snappy
    // shimmer streaks diagonally (350ms, overlapping with the ring slip for cohesion). Both use
    // easeOutExpo (cubic-bezier(0.16, 1, 0.3, 1)) — fast accelerate at the start, dramatic
    // decelerate to settle. Gives the swipe some verve without an overshoot. Only renders during
    // this beat; the ::after is conditional so there's no stale pseudo sitting on every cover.
    ...($justAcquired && {
      animation: 'cover-acquire 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
    }),

    '&::after': $justAcquired
      ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.10) 47%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.10) 53%, transparent 65%)',
          transform: 'translateX(-120%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          animation: 'cover-shimmer 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
        }
      : {},
  })
);

export const Cover = styled('img')<{ $loaded: boolean }>(({ $loaded }) => ({
  width: 'clamp(155px, 16vw, 200px)',
  aspectRatio: '2 / 3',
  objectFit: 'cover',
  display: 'block',
  opacity: $loaded ? 1 : 0,
  transition: 'opacity 0.2s ease',
}));

export const CoverPlaceholder = styled('div')(({ theme }) => ({
  position: 'relative',
  width: 'clamp(155px, 16vw, 200px)',
  aspectRatio: '2 / 3',
  borderRadius: theme.radius.sm,
  flexShrink: 0,
  overflow: 'hidden',
  background: '#2a2a2a',
  boxShadow: coverDropShadow,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(5),
  gap: theme.spacing(2),
  textAlign: 'center' as const,

  [`&:hover ${CoverEditOverlay}`]: { opacity: 1 },
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
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

/*
 * Action row container for the status button and (later) the ⋯ more-actions button. Lives inside
 * HeroMeta (flex column) and uses align-self: flex-start so the button sizes to its content rather
 * than stretching to the row width.
 */
export const HeroActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: theme.spacing(2),
}));

export const AuthorLink = styled(Link)(({ theme }) => ({
  color: theme.text,
  textDecoration: 'none',
  borderBottom: '1px solid transparent',
  transition: 'border-color 0.15s ease',
  '&:hover': {
    borderBottomColor: theme.textMuted,
  },
}));

export const Byline = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

export const Dot = styled('span')(({ theme }) => ({
  color: theme.textMuted,
  userSelect: 'none',
}));

export const Divider = styled('hr')(({ theme }) => ({
  border: 'none',
  borderTop: `1px solid ${theme.borderSoft}`,
  margin: 0,
}));

export const SectionLabel = styled('div')({});

/*
 * Keeps the description label, body, and category pills bound together so the Layout's flex gap
 * doesn't separate them. The proto's vertical rhythm is: section-label → 12px → description →
 * 12px → pills. Without this wrapper they'd inherit the page's 24px Content gap.
 */
export const DescriptionSection = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

/*
 * Description is rendered as multiple <p> elements (one per paragraph) rather than one <p> with
 * pre-line whitespace, so the inter-paragraph gap can be set explicitly (12px) instead of
 * inheriting the body line-height (~30px at body1's 1.75 × 17px). Single newlines inside a
 * paragraph are still preserved as soft breaks via white-space: pre-line.
 *
 * The ::first-letter drop cap is one of the rare places we set fontFamily/fontSize outside <Text>.
 * CSS pseudo-elements can't be composed via React children, and the typographic effect (italic
 * accent letter that floats and drop-caps two lines of body) only works when bound to the actual
 * formatted block. Selector targets the FIRST <p> only so subsequent paragraphs don't also get a
 * drop cap. Bounded exception — do not generalize.
 */
export const Description = styled('div')(({ theme }) => ({
  maxWidth: '680px',

  '& > p': {
    whiteSpace: 'pre-line',
  },

  '& > p + p': {
    marginTop: theme.spacing(3),
  },

  '& > p:first-child::first-letter': {
    fontFamily: theme.fontDisplay,
    fontStyle: 'italic',
    fontWeight: 500,
    fontSize: '3.5rem',
    lineHeight: 0.9,
    float: 'left',
    margin: `${theme.spacing(1)} ${theme.spacing(2)} 0 0`,
    color: theme.accent,
  },
}));

/**
 * Contenteditable span for inline title editing. Inherits font from the wrapping <Text> element
 * so token references stay out of this file. Single-line — Enter is handled at the hook level
 * to blur instead of inserting a newline.
 */
export const TitleInlineEditor = styled('span')({
  outline: 'none',
  font: 'inherit',
  cursor: 'text',
  display: 'block',
  wordBreak: 'break-word',
});

/*
 * Contenteditable div for inline description editing. Mirrors the read-mode paragraph structure:
 * <p> children with the same 12px inter-paragraph gap and the same drop-cap ::first-letter.
 * Uses font: inherit from the <Text variant="body1" as="div"> wrapper — the only way to pass font
 * to a contenteditable element without referencing tokens directly. Bounded exception (font
 * properties on pseudo-elements and child selectors); do not generalize.
 */
export const DescriptionInlineEditor = styled('div')(({ theme }) => ({
  outline: 'none',
  font: 'inherit',
  cursor: 'text',
  minHeight: '1em',

  '& > p': {
    whiteSpace: 'pre-line',
    font: 'inherit',
  },

  '& > p + p': {
    marginTop: theme.spacing(3),
  },

  '& > p:first-child::first-letter': {
    fontFamily: theme.fontDisplay,
    fontStyle: 'italic',
    fontWeight: 500,
    fontSize: '3.5rem',
    lineHeight: 0.9,
    float: 'left',
    margin: `${theme.spacing(1)} ${theme.spacing(2)} 0 0`,
    color: theme.accent,
  },

  // Collapse the drop cap on focus rather than let Chromium corrupt its color mid-edit.
  '&:focus > p:first-child::first-letter': {
    all: 'unset',
  },
}));

export const ReadingSince = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export const ReadingSinceDot = styled('span')(({ theme }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  flexShrink: 0,
  background: theme.accent,
  boxShadow: `0 0 0 3px ${theme.accentSoft}`,
}));

export const MetaGrid = styled('dl')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: theme.spacing(8),
  rowGap: theme.spacing(3),
  maxWidth: '480px',
  alignItems: 'baseline',
}));

export const MetaLabel = styled('dt')({
  margin: 0,
});

export const MetaValue = styled('dd')({
  margin: 0,
});

export const CoverDialogForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
}));

export const CoverDialogActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
}));
