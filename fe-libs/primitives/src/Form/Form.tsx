import { StyledFormRoot, StyledFormField, StyledFormLabel } from './Form.styles';

/**
 * Styled wrapper around Radix Form.Root. Provides the flex-column layout and consistent gap that
 * all Livre forms share. Use this as the form container; Radix Form.Control, Form.Message, and
 * Form.Submit are used directly from @radix-ui/react-form.
 */
export const FormRoot = StyledFormRoot;

/**
 * Styled wrapper around Radix Form.Field. Groups a label, control, and validation messages for a
 * single field. Inherits Radix's label/control association via context so htmlFor/id wiring is
 * not needed.
 */
export const FormField = StyledFormField;

/**
 * Styled wrapper around Radix Form.Label. Renders as a block-level label that participates in
 * Radix Form's automatic label/control association.
 */
export const FormLabel = StyledFormLabel;
