import * as RadixForm from '@radix-ui/react-form';
import { StyledFormRoot, StyledFormField, StyledFormLabel } from './Form.styles';

/**
 * Namespace for Radix Form pieces, styled to Livre's layout conventions. Use Form.Root as the
 * form container, Form.Field to group each label/control/message unit, and Form.Label,
 * Form.Control, Form.Message, Form.Submit for the individual pieces. Radix handles label-control
 * association and validation state automatically via context — no htmlFor/id wiring needed.
 */
export const Form = {
  Root: StyledFormRoot,
  Field: StyledFormField,
  Label: StyledFormLabel,
  Control: RadixForm.Control,
  Message: RadixForm.Message,
  Submit: RadixForm.Submit,
};
