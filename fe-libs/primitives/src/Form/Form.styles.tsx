import styled from 'styled-components';
import * as RadixForm from '@radix-ui/react-form';

export const StyledFormRoot = styled(RadixForm.Root)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(5),
}));

export const StyledFormField = styled(RadixForm.Field)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const StyledFormLabel = styled(RadixForm.Label)({
  display: 'block',
  cursor: 'pointer',
});
