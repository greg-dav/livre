import styled from 'styled-components';

export const Panel = styled('aside')<{ $justAcquired?: boolean; $focusMode?: boolean }>(
  ({ theme, $justAcquired, $focusMode }) => ({
    background: theme.bgElevated,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(6),
    marginTop: theme.spacing(6),
    maxHeight: `calc(100dvh - ${theme.spacing(13)} - ${theme.spacing(8)} - ${theme.spacing(6)} - 48px)`,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
    ...($justAcquired && {
      animation: 'journal-entrance 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both',
    }),
    ...($focusMode && {
      maxHeight: 'none',
      overflow: 'visible',
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      padding: 0,
      marginTop: 0,
    }),
    // On mobile the journal only renders inside the sheet dialog, which supplies the card chrome and
    // scrolling — flatten the panel so it fills the sheet cleanly with no nested border/padding.
    [theme.media.mobile]: {
      maxHeight: 'none',
      overflow: 'visible',
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      padding: 0,
      marginTop: 0,
    },
  })
);

export const Head = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(5),
}));

const headerButton = (theme: import('styled-components').DefaultTheme) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${theme.spacing(1.5)} ${theme.spacing(2.5)}`,
  borderRadius: theme.radius.sm,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.15s ease',
  '& span': { color: theme.textMuted, transition: 'color 0.15s' },
  '&:hover': { background: theme.bg },
  '&:hover span': { color: theme.text },
});

export const FocusButton = styled('button')(({ theme }) => headerButton(theme));

export const CollapseButton = styled('button')(({ theme }) => headerButton(theme));

export const RatingRow = styled('div')<{ $focusMode?: boolean }>(({ theme, $focusMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: $focusMode ? '20px' : theme.spacing(4),
  marginBottom: $focusMode ? theme.spacing(6) : theme.spacing(4),
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

/*
 * Visual delineation between review and timeline. 18px (4.5 × 4px) is half-step on the grid —
 * intentional: the prototype uses tighter rhythm inside the panel than on the page itself.
 */
export const ReviewSection = styled('section')<{ $focusMode?: boolean }>(
  ({ theme, $focusMode }) => ({
    paddingBottom: $focusMode ? 0 : theme.spacing(4.5),
    marginBottom: $focusMode ? 0 : theme.spacing(4.5),
    borderBottom: $focusMode ? 'none' : `1px solid ${theme.borderSoft}`,
  })
);

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
  '&:focus-within': { borderColor: theme.accent, boxShadow: `0 0 0 3px ${theme.accentSoft}` },
}));

export const ComposerInputWrap = styled('div')<{ $focusMode?: boolean }>(({ $focusMode }) => ({
  padding: `10px 12px`,
  minHeight: $focusMode ? '80px' : '60px',
  cursor: 'text',
}));

export const ComposerEditable = styled('div')(({ theme }) => ({
  font: 'inherit',
  outline: 'none',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  color: theme.textMuted,
  '&:focus': { color: theme.text },
  '&:empty::before': {
    content: 'attr(data-placeholder)',
    color: theme.textMuted,
    pointerEvents: 'none',
    display: 'block',
  },
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

export const JournalGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
  gap: '56px',
  marginTop: '8px',
});

export const JournalLeftCol = styled('div')({});

export const JournalRightCol = styled('div')({});

export const RightColHead = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const ReviewEditor = styled('div')(({ theme }) => ({
  minHeight: '320px',
  // The 320px is sized for the desktop full-page focus view; in the mobile sheet it would dominate,
  // so keep it compact there.
  [theme.media.mobile]: { minHeight: '120px' },
  padding: '14px 18px',
  background: theme.bgElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: '10px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  font: 'inherit',
  outline: 'none',
  '&:empty::before': {
    content: '"Write your review…"',
    color: theme.textMuted,
    pointerEvents: 'none',
  },
  '&:focus': {
    borderColor: theme.accent,
    boxShadow: `0 0 0 3px ${theme.accentSoft}`,
  },
}));
