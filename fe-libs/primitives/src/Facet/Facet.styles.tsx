import styled from 'styled-components';

// Vertical list on desktop; a horizontal chip scroller on mobile. `$bleed` cancels a parent's
// horizontal padding (assumed to be the standard `spacing(4)` mobile page inset) so the scroll
// track runs edge-to-edge, while the matching inner padding keeps the first chip aligned with the
// surrounding content. Omit `$bleed` when the parent has no horizontal padding to cancel.
export const FacetList = styled('div')<{ $bleed?: boolean }>(({ theme, $bleed }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  [theme.media.mobile]: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    overflowX: 'auto',
    paddingBlock: theme.spacing(1),
    paddingInline: theme.spacing(4),
    ...($bleed && { marginInline: `-${theme.spacing(4)}` }),
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  },
}));

// Full-width search field that filters the facet list. It flows inside the parent's padding (rather
// than bleeding edge-to-edge like the chip scroller), so it stays aligned with the section heading.
export const FacetSearchField = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  marginBottom: theme.spacing(1.5),
}));

export const FacetSearchInput = styled('input')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  padding: `7px ${theme.spacing(2.25)}`,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.md,
  background: 'transparent',
  color: theme.text,
  font: 'inherit',
  outline: 'none',
  transition: 'border-color 0.13s',
  '&:focus': { borderColor: theme.accent },
  '&::placeholder': { color: theme.textMuted },
}));

// Inline completion painted under the input: the typed prefix is transparent so it aligns exactly
// under the real text, leaving only the suffix visible. Padding/border must mirror the input.
export const FacetSearchGhost = styled('span')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  padding: `7px ${theme.spacing(2.25)}`,
  border: '1px solid transparent',
  whiteSpace: 'pre',
  pointerEvents: 'none',
  color: theme.textMuted,
  '& > span': { color: 'transparent' },
}));

export const FacetRow = styled('button')<{
  $active: boolean;
  $radio?: boolean;
  $disabled?: boolean;
}>(({ theme, $active, $disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  width: '100%',
  padding: `7px ${theme.spacing(2.25)}`,
  borderRadius: theme.radius.md,
  border: 'none',
  background: $active ? theme.accentSoft : 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.13s',
  ...($disabled && { opacity: 0.36, pointerEvents: 'none' }),
  '&:hover': { background: theme.accentSoft },
  '& .facet-name': {
    color: $active ? theme.accent : theme.textMuted,
    transition: 'color 0.13s',
  },
  '&:hover .facet-name': { color: $active ? theme.accent : theme.text },
  // Pill chip on mobile (tick hidden): active state reads from the border + fill.
  [theme.media.mobile]: {
    flexShrink: 0,
    width: 'auto',
    gap: theme.spacing(1.5),
    padding: `7px ${theme.spacing(3)}`,
    borderRadius: theme.radius.full,
    border: `1px solid ${$active ? theme.accent : theme.border}`,
    background: $active ? theme.accentSoft : theme.bgElevated,
    whiteSpace: 'nowrap',
  },
}));

export const FacetTick = styled('span')<{ $active: boolean; $radio?: boolean }>(
  ({ theme, $active, $radio }) => ({
    width: '14px',
    height: '14px',
    borderRadius: $radio ? '50%' : theme.radius.sm,
    border: `1.5px solid ${$active ? theme.accent : theme.border}`,
    background: $active ? theme.accent : 'transparent',
    color: theme.textOnColor,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.13s',
    [theme.media.mobile]: { display: 'none' },
  })
);

// Flex containers (not bare inline spans) so the wrapper's inherited strut can't anchor the smaller
// text low in the line box — the child text's own box governs and centers cleanly in the row.
export const FacetName = styled('span')({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
});

export const FacetCount = styled('span')({
  display: 'flex',
  alignItems: 'center',
  opacity: 0.7,
});

export const FacetClear = styled('button')(({ theme }) => ({
  alignSelf: 'flex-start',
  padding: `${theme.spacing(1)} ${theme.spacing(2.25)}`,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  textDecorationColor: theme.border,
  '& .clear-label': {
    color: theme.textMuted,
    transition: 'color 0.15s',
  },
  '&:hover .clear-label': { color: theme.text },
  // Trailing item in the horizontal chip scroller — don't shrink or top-align it.
  [theme.media.mobile]: {
    flexShrink: 0,
    alignSelf: 'center',
    whiteSpace: 'nowrap',
  },
}));

// Hairline separator between facet groups inside the mobile chip scroller (e.g. scope vs shelf).
export const FacetSeparator = styled('span')(({ theme }) => ({
  display: 'none',
  [theme.media.mobile]: {
    display: 'block',
    flexShrink: 0,
    alignSelf: 'stretch',
    width: '1px',
    margin: `${theme.spacing(1)} 2px`,
    background: theme.borderSoft,
  },
}));
