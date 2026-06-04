import styled from 'styled-components';

// The fields, stacked. Layout (scroll, pinned header/footer) is owned by ScrollDialog; this just
// sets the vertical rhythm of the form controls inside the scroll body.
export const Fields = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
}));

export const Field = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

export const FieldRow = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(4),
}));

// Segmented shelf picker — one pill per status, the selected one carrying the accent wash.
export const ShelfPicker = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

export const ShelfOption = styled('button')<{ $selected: boolean }>(({ theme, $selected }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(3.5)}`,
  borderRadius: theme.radius.lg,
  border: `1px solid ${$selected ? theme.accent : theme.border}`,
  background: $selected ? theme.accentSoft : theme.bg,
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
  '&:hover': {
    borderColor: $selected ? theme.accent : theme.textMuted,
  },
}));

// Disclosure toggle for the optional metadata — quiet, left-aligned, with a rotating chevron.
export const MoreToggle = styled('button')(({ theme }) => ({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: `${theme.spacing(1)} 0`,
  cursor: 'pointer',
  color: theme.textMuted,
  transition: 'color 0.15s',
  '&:hover': {
    color: theme.text,
  },
}));

// Animated disclosure: the grid 0fr→1fr trick slides the optional fields open/closed without a fixed
// max-height. The inner element clips during the transition; the fields stay mounted either way.
export const MoreWrap = styled('div')<{ $open: boolean }>(({ $open }) => ({
  display: 'grid',
  gridTemplateRows: $open ? '1fr' : '0fr',
  opacity: $open ? 1 : 0,
  transition: 'grid-template-rows 0.25s ease, opacity 0.25s ease',
}));

export const MoreInner = styled('div')({
  overflow: 'hidden',
  minHeight: 0,
});

export const MoreFields = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  paddingTop: theme.spacing(1),
}));
