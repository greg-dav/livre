import styled from 'styled-components';

export const Timeline = styled('div')<{ $single?: boolean; $flush?: boolean }>(
  ({ theme, $single, $flush }) => ({
    position: 'relative',
    // 18px so entry content starts clear of the rail; pins are offset within each entry to center on
    // the 4px rail (see TimelineEntry::before).
    paddingLeft: theme.spacing(4.5),
    // Book-detail needs breathing room below the composer; the log dialog sits flush under its header.
    marginTop: $flush ? 0 : theme.spacing(5),
    ...($single
      ? {}
      : {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '4px',
            top: theme.spacing(3),
            bottom: theme.spacing(5),
            width: '1px',
            background: theme.borderSoft,
          },
        }),
  })
);

export const TimelineEntry = styled('div')<{
  $landmark?: boolean;
  $open?: boolean;
  $clickable?: boolean;
  $focused?: boolean;
}>(({ theme, $landmark, $open, $clickable, $focused }) => {
  // Pin geometry matches the book-detail prototype verbatim. boxSizing: content-box opts the
  // pseudo-element out of the global border-box reset so width/height measure the content area
  // (border adds on top), exactly as the prototype CSS intends. The log stays monochrome: finished
  // landmarks use the same accent pin as any other — no green here (green lives in the gantt only).
  const node = $landmark
    ? $open
      ? {
          left: '-20px',
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
          border: `1px solid ${theme.accent}`,
        }
    : {
        left: '-18px',
        top: '13px',
        width: '7px',
        height: '7px',
        background: theme.bgElevated,
        border: `1px solid ${theme.textMuted}`,
      };
  // Clickable and focused entries get a small symmetric inset so the hover / focus background fills
  // without clipping against the rail. Absolute pin offsets are measured from the border box, so
  // padding doesn't shift the pins.
  const inset = $clickable || $focused;
  return {
    position: 'relative',
    padding: `6px 0 ${theme.spacing(3.5)}`,
    ...(inset && {
      borderRadius: theme.radius.sm,
      paddingLeft: '4px',
      paddingRight: '4px',
    }),
    ...($focused && { background: theme.accentSoft }),
    ...($clickable && {
      cursor: 'pointer',
      transition: 'background 0.15s ease',
      '&:hover': { background: theme.accentSoft },
      '&::after': {
        content: '""',
        position: 'absolute',
        left: '4px',
        right: '4px',
        bottom: '1px',
        borderBottom: `1px dashed ${theme.border}`,
        opacity: 0,
        transition: 'opacity 0.15s ease',
      },
      '&:hover::after': { opacity: 1 },
    }),
    '&::before': {
      content: '""',
      position: 'absolute',
      borderRadius: '50%',
      boxSizing: 'content-box',
      zIndex: 1,
      ...node,
    },
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

export const QuoteBlock = styled('div')(({ theme }) => ({
  borderLeft: `2px solid ${theme.accent}`,
  paddingLeft: theme.spacing(3),
  marginTop: theme.spacing(1),
}));

export const CycleMethod = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1.5),
}));

export const CycleDivider = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  margin: `${theme.spacing(0.5)} 0 ${theme.spacing(2.5)}`,
  color: theme.textMuted,
  '&::after': {
    content: '""',
    flex: 1,
    borderTop: `1px dashed ${theme.border}`,
  },
}));
