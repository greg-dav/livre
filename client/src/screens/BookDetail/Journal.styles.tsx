import styled, { keyframes } from 'styled-components';

/*
 * Entrance animation when a book has just been added to the library. Delay (0.15s) lets the
 * cover-acquire ring slip out first; subtle inward slide gives the panel a "settling in"
 * feel rather than just popping. easeOutExpo (cubic-bezier(0.16, 1, 0.3, 1)) matches the
 * cover so the two animations feel like one motion.
 */
const journalEntrance = keyframes`
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

/*
 * Sticky right-rail container. Holds the journal contents (rating, review, log, composer) and
 * remains in view as the user scrolls past long descriptions. max-height + overflow lets the
 * panel scroll independently when its own content exceeds the viewport.
 */
export const Panel = styled('aside')<{ $justAcquired?: boolean }>(({ theme, $justAcquired }) => ({
  position: 'sticky',
  top: theme.spacing(24),
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.lg,
  padding: theme.spacing(6),
  maxHeight: 'calc(100vh - 128px)',
  overflowY: 'auto',
  ...($justAcquired && {
    animation: `${journalEntrance} 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both`,
  }),
}));

export const Head = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(5),
}));

export const FocusButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${theme.spacing(1.5)} ${theme.spacing(2.5)}`,
  borderRadius: theme.radius.sm,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.15s ease',
  '& span': {
    color: theme.textMuted,
    transition: 'color 0.15s',
  },
  '&:hover': { background: theme.bg },
  '&:hover span': { color: theme.text },
}));

export const RatingRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

/*
 * Visual delineation between review and timeline. 18px (4.5 × 4px) is half-step on the grid —
 * intentional: the prototype uses tighter rhythm inside the panel than on the page itself.
 */
export const ReviewSection = styled('section')(({ theme }) => ({
  paddingBottom: theme.spacing(4.5),
  marginBottom: theme.spacing(4.5),
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

export const ReviewHead = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: theme.spacing(2),
}));

export const ExpandInline = styled('button')({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
});

/*
 * 4-line preview clamp. The -webkit-line-clamp pattern requires the wrapping element to use the
 * legacy webkit box display — supported in every modern browser despite the prefix. The body
 * Text variant inside still controls font, line-height, and color; this wrapper only owns the
 * truncation behavior.
 */
export const ReviewBody = styled('div')({
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const ReviewEmpty = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(2)} 0`,
}));

export const Composer = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(3.5),
  background: theme.bg,
  border: `1px solid ${theme.borderSoft}`,
  borderRadius: theme.radius.md,
  overflow: 'hidden',
  transition: 'border-color 0.15s ease',
  '&:focus-within': { borderColor: theme.accent },
}));

export const ComposerInput = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(2.5)} ${theme.spacing(3)}`,
  minHeight: theme.spacing(15),
}));

export const ComposerBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  borderTop: `1px solid ${theme.borderSoft}`,
  background: theme.bgElevated,
}));

export const ComposerButton = styled('button')<{ $active?: boolean; $primary?: boolean }>(
  ({ theme, $active, $primary }) => ({
    background: $active ? theme.accentSoft : 'none',
    border: 'none',
    cursor: 'pointer',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderRadius: theme.radius.sm,
    transition: 'all 0.15s ease',
    '& span': {
      color: $active || $primary ? theme.accent : theme.textMuted,
      transition: 'color 0.15s',
    },
    '&:hover': { background: $active ? theme.accentSoft : theme.bg },
    '&:hover span': { color: $active || $primary ? theme.accent : theme.text },
  })
);

export const ComposerSpacer = styled('div')({ flex: 1 });

/*
 * Vertical reading-log timeline. The connecting hairline isn't drawn on this container — it's
 * drawn per-entry via TimelineEntry::after, so it can be clipped at the first/last node's
 * center instead of overshooting them. The container only provides padding-left for nodes to
 * jut into and vertical rhythm before the first entry.
 */
export const Timeline = styled('div')(({ theme }) => ({
  position: 'relative',
  paddingLeft: theme.spacing(4.5),
  marginTop: theme.spacing(5),
}));

/*
 * Three node states: plain dot (notes/quotes), filled accent dot (closed landmark — Started,
 * Finished), and open ring (active landmark — currently reading). The ring distinguishes
 * "in-progress" from completed events without needing a separate icon.
 *
 * The connecting hairline is rendered per-entry on ::after rather than as a single rail on
 * Timeline so we can clip it at the first/last node's vertical center — no overshoot above
 * the first node, no overshoot below the last. The line sits at left: -15px (matching the
 * 9px landmark and 7px regular dots, whose horizontal centers both land at left: -14.5px
 * relative to the entry), and is hidden when the entry is the only child.
 *
 * z-index keeps the node ::before painted on top of the ::after line where they overlap, so
 * the line visually terminates at the node edge without needing extra geometry.
 */
export const TimelineEntry = styled('div')<{ $landmark?: boolean; $open?: boolean }>(({
  theme,
  $landmark,
  $open,
}) => {
  // All three node types are sized and positioned so their horizontal centers land at the
  // same x (entry coord -14.5px) as the connecting line — the line at left: -15px / width 1px
  // also centers at -14.5. Closed landmark needs no border (the accent fill carries it); open
  // landmark's 2px border widens its visual box to 13px, so its left shifts further out to
  // keep the center aligned.
  const node = $landmark
    ? $open
      ? {
          left: '-21px',
          top: '10px',
          width: '9px',
          height: '9px',
          background: theme.bgElevated,
          border: `2px solid ${theme.accent}`,
        }
      : {
          left: '-19px',
          top: '11px',
          width: '9px',
          height: '9px',
          background: theme.accent,
        }
    : {
        left: '-19px',
        top: '13px',
        width: '7px',
        height: '7px',
        background: theme.bgElevated,
        border: `1px solid ${theme.textMuted}`,
      };
  // Node vertical center, measured from entry top. Used to clip the line at the first/last
  // entry so it terminates at the node center rather than overshooting into empty padding.
  const nodeCenterY = $landmark ? '15px' : '16px';
  return {
    position: 'relative',
    padding: `6px 0 ${theme.spacing(3.5)}`,
    '&::before': {
      content: '""',
      position: 'absolute',
      borderRadius: '50%',
      zIndex: 1,
      ...node,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '-15px',
      top: 0,
      bottom: 0,
      width: '1px',
      background: theme.borderSoft,
      zIndex: 0,
    },
    '&:first-child::after': { top: nodeCenterY },
    '&:last-child::after': { bottom: 'auto', height: nodeCenterY },
    '&:only-child::after': { display: 'none' },
  };
});

export const LandmarkHead = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(2.5),
}));

export const NoteMeta = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));
