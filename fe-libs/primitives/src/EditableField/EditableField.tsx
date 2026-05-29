import styled from 'styled-components';

/**
 * Button wrapper that signals an inline field is click-to-edit. Applies accentSoft background
 * and a dashed bottom border on hover. Negative margin/padding compensation keeps content visually
 * flush with surrounding read-only text. Use whenever a metadata value or short text field opens
 * an edit dialog on click.
 */
export const EditableField = styled('button')(({ theme }) => ({
  all: 'unset',
  display: 'block',
  borderRadius: theme.radius.sm,
  padding: '2px 4px',
  margin: '-2px -4px',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
  position: 'relative',

  '&::after': {
    content: '""',
    position: 'absolute',
    left: '4px',
    right: '4px',
    bottom: '1px',
    borderBottom: `1px dashed ${theme.border}`,
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },

  '&:hover': { background: theme.accentSoft },
  '&:hover::after': { opacity: 1 },
}));
