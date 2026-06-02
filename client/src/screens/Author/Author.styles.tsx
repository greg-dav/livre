import styled from 'styled-components';

export const Toolbar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: theme.spacing(8),
}));

export const HeadLine = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

export const Results = styled('div')({});
