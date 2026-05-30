import styled from 'styled-components';

export const Frame = styled('div')(({ theme }) => ({
  height: '108px',
  width: '100%',
  display: 'flex',
  overflow: 'hidden',
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.border}`,
  background: theme.bg,
}));

export const Rail = styled('div')(({ theme }) => ({
  width: '24px',
  flexShrink: 0,
  background: theme.bgElevated,
  borderRight: `1px solid ${theme.borderSoft}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: `${theme.spacing(2.5)} 0`,
}));

export const RailDot = styled('span')<{ $accent?: boolean }>(({ theme, $accent }) => ({
  width: '8px',
  height: '8px',
  borderRadius: theme.radius.full,
  background: $accent ? theme.accent : theme.textMuted,
  opacity: $accent ? 1 : 0.5,
}));

export const Side = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
});

export const Bar = styled('div')(({ theme }) => ({
  height: '20px',
  flexShrink: 0,
  borderBottom: `1px solid ${theme.borderSoft}`,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${theme.spacing(2.5)}`,
}));

export const BarStub = styled('span')(({ theme }) => ({
  width: '42%',
  height: '6px',
  borderRadius: theme.radius.full,
  background: theme.bgSunken,
}));

export const Canvas = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
}));

export const Spine = styled('div')(({ theme }) => ({
  position: 'relative',
  flex: 1,
  borderRadius: theme.radius.sm,
  background: theme.bgSunken,
  border: `1px solid ${theme.borderSoft}`,
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: theme.accent,
  },
}));
