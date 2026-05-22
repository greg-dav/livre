import styled from 'styled-components';
import * as Dialog from '@radix-ui/react-dialog';

export const Overlay = styled(Dialog.Overlay)({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.88)',
  zIndex: 200,
});

export const Content = styled(Dialog.Content)({
  position: 'fixed',
  inset: 0,
  zIndex: 201,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '&:focus': {
    outline: 'none',
  },
});

export const Image = styled('img')(({ theme }) => ({
  maxWidth: '90vw',
  maxHeight: '90vh',
  objectFit: 'contain',
  borderRadius: theme.radius.sm,
  boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
}));

// Fills the entire content area behind the image — clicking anywhere outside the image hits this
export const Backdrop = styled('button')({
  position: 'absolute',
  inset: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'default',
});

export const VisuallyHidden = styled('span')({
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
});
