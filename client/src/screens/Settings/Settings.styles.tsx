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
