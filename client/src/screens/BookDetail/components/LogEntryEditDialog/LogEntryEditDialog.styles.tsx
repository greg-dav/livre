import styled from 'styled-components';
import { Textarea } from '@livre/primitives';

export const DeleteButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  borderRadius: theme.radius.sm,
  transition: 'all 0.15s ease',
  '& span': { color: theme.textMuted, transition: 'color 0.15s' },
  '&:hover': { background: theme.bg },
  '&:hover span': { color: theme.text },
}));

export const FooterSpacer = styled('div')({ flex: 1 });

export const NoteTextarea = styled(Textarea)({ minHeight: '100px' });

// Inline variant of the editor, used in place of the dialog inside the mobile journal sheet so the
// edit happens within the existing sheet rather than stacking a second one over it.
export const InlinePanel = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: theme.spacing(3.5),
}));

export const InlineHead = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

export const InlineBackButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${theme.spacing(2)} ${theme.spacing(2)}`,
  margin: `${theme.spacing(-2)} 0`,
  borderRadius: theme.radius.sm,
  '& span': { color: theme.textMuted, transition: 'color 0.15s' },
  '&:active span': { color: theme.text },
}));

export const InlineFields = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
}));

export const InlineActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));
