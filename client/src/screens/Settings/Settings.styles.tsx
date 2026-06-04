import styled from 'styled-components';

export const Split = styled('div')({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
});

export const NavPanel = styled('nav')(({ theme }) => ({
  width: '272px',
  flexShrink: 0,
  background: theme.bg,
  borderRight: `1px solid ${theme.borderSoft}`,
  overflowY: 'auto',
  padding: `${theme.spacing(6)} ${theme.spacing(4.5)} ${theme.spacing(10)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const NavHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  marginBottom: theme.spacing(3),
  padding: `0 ${theme.spacing(2)}`,
}));

// A second-level header that opens a grouped run of nav items (e.g. the admin-only sections), set
// off from the group above it with extra top space so the two read as distinct sections.
export const NavGroupHeader = styled(NavHeader)(({ theme }) => ({
  marginTop: theme.spacing(5),
}));

export const NavDivider = styled('hr')(({ theme }) => ({
  flex: 1,
  border: 'none',
  borderTop: `1px solid ${theme.borderSoft}`,
  margin: 0,
}));

export const NavItem = styled('button')<{ $active?: boolean }>(({ theme, $active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  width: '100%',
  padding: `${theme.spacing(2.5)} ${theme.spacing(3)}`,
  borderRadius: '9px',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  background: $active ? theme.accentSoft : 'none',
  color: $active ? theme.accent : theme.textMuted,
  transition: 'background 0.15s, color 0.15s',
  '&:hover': {
    background: theme.accentSoft,
    color: $active ? theme.accent : theme.text,
  },
}));

export const ContentPanel = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  padding: `${theme.spacing(10)} ${theme.spacing(12)} ${theme.spacing(20)}`,
}));

export const ContentInner = styled('div')({
  maxWidth: '600px',
});

// A settings tab's outer frame: the header followed by content blocks, all on one vertical rhythm.
export const SectionRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(9),
}));

// Header row: stacked title + description on the left, an optional action aligned to the trailing
// edge. flex-start keeps the action pinned to the title even when the description wraps.
export const SectionHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
}));

export const SectionHeading = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const Block = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(5),
}));

// A block's label + supporting copy, kept tight so the description reads as part of the heading
// rather than a separate row in the block's looser gap.
export const BlockHead = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const Field = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const Actions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  marginTop: theme.spacing(1),
}));

// Inline status line beneath a form's actions; colour comes from the Text variant, not here.
export const Feedback = styled('div')(({ theme }) => ({
  minHeight: theme.spacing(4),
  display: 'flex',
  alignItems: 'center',
}));

export const DialogActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

// The variable content of an import/export dialog, on its own vertical rhythm and set off from the
// dialog's title/description above and the action row below — so the format selector never sits
// flush against the buttons.
export const DialogBody = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(3),
}));

// Shared surface for the bordered cards inside the import/export dialogs (format chooser, result
// tally) so they read as defined controls on the dialog background — and stay visually identical.
const DialogCard = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: `${theme.spacing(4)} ${theme.spacing(4)} ${theme.spacing(5)}`,
  border: `1px solid ${theme.borderSoft}`,
  borderRadius: theme.radius.lg,
  background: theme.bgElevated,
}));

// Container that gives the format chooser a header + the list of options.
export const FormatCard = styled(DialogCard)(({ theme }) => ({
  gap: theme.spacing(3),
}));

// Vertical list of selectable formats inside the card.
export const FormatList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

// A single selectable format row; the accent ring marks the current choice.
export const FormatOption = styled('button')<{ $selected: boolean }>(({ theme, $selected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
  borderRadius: theme.radius.md,
  border: `1px solid ${$selected ? theme.accent : theme.border}`,
  background: $selected ? theme.accentSoft : theme.bg,
  color: $selected ? theme.accent : theme.text,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
  '&:hover': {
    borderColor: theme.accent,
  },
}));

// A format/source option's label, stacked so a metered source can show a usage line beneath its name.
export const OptionLabel = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

// The usage meter shown inside the source card for a metered source: a thin bar plus a caption.
export const Meter = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}));

// The file chooser row: a button to pick a .csv and the chosen filename beside it.
export const FileRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

// Tally of imported / skipped / failed counts shown after an import completes. Shares the format
// card's surface (border, radius, fill) so the two dialogs feel of a piece.
export const ResultList = styled(DialogCard)(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const ResultRow = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
}));
