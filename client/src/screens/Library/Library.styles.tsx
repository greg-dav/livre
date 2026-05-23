import styled from 'styled-components';

export const Split = styled('div')({
  width: '100%',
});

export const LeftPanel = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: '65px',
  left: 0,
  bottom: 0,
  width: '280px',
  background: theme.bg,
  borderRight: `1px solid ${theme.borderSoft}`,
  overflowY: 'auto',
  padding: `${theme.spacing(12)} ${theme.spacing(5)} ${theme.spacing(10)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const LeftPanelHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  marginBottom: theme.spacing(1),
}));

export const LeftPanelDivider = styled('hr')(({ theme }) => ({
  flex: 1,
  border: 'none',
  borderTop: `1px solid ${theme.borderSoft}`,
  margin: 0,
}));

export const RightPanel = styled('div')(({ theme }) => ({
  marginLeft: '280px',
  padding: `${theme.spacing(7)} ${theme.spacing(10)} ${theme.spacing(20)}`,
}));

export const ShelfHeading = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(7),
}));

export const ShelfHeadingLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(3),
}));
