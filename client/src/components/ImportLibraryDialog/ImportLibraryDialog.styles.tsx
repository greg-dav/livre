import styled from 'styled-components';

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

// The variable content of the dialog, on its own vertical rhythm and set off from the title above
// and the action row below — so the format selector never sits flush against the buttons.
export const DialogBody = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(3),
}));

// Shared surface for the bordered cards inside the dialog (format chooser, result tally) so they
// read as defined controls on the dialog background.
const DialogCard = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: `${theme.spacing(4)} ${theme.spacing(4)} ${theme.spacing(5)}`,
  border: `1px solid ${theme.borderSoft}`,
  borderRadius: theme.radius.lg,
  background: theme.bgElevated,
}));

export const FormatCard = styled(DialogCard)(({ theme }) => ({
  gap: theme.spacing(3),
}));

export const FormatList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

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

export const OptionLabel = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

export const Meter = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}));

export const FileRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

export const ResultList = styled(DialogCard)(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const ResultRow = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
}));
