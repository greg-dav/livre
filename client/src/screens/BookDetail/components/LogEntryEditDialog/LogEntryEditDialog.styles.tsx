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
