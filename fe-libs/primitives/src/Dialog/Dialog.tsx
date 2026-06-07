import { type FormEvent, type ReactNode } from 'react';
import styled from 'styled-components';
import * as Radix from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Text } from '../Text/Text';
import { KeyboardInset } from './KeyboardInset';

interface DialogProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface BareDialogProps {
  trigger?: ReactNode;
  /** Accessible name only — never rendered visibly. Provide your own header inside children. */
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ScrollDialogProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  /** Pinned footer, typically the action buttons. Omit for a body-only scroll dialog. */
  footer?: ReactNode;
  /**
   * When provided, the body + footer are wrapped in a <form> so Enter submits and a footer button
   * with type="submit" participates. The header stays outside the form (it holds no controls).
   */
  onSubmit?: (e: FormEvent) => void;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Overlay = styled(Radix.Overlay)({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 200,
});

const Content = styled(Radix.Content)<{ $flush?: boolean }>(({ theme, $flush }) => ({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: theme.spacing(120),
  // Never exceed the viewport; children that overflow (e.g. a long log body) scroll internally.
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius.lg,
  // Flush variant drops the uniform padding so the ScrollDialog's header/body/footer own their own
  // insets and the divider lines span edge to edge.
  padding: $flush ? 0 : theme.spacing(6),
  boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
  zIndex: 201,

  '&:focus': {
    outline: 'none',
  },

  // On mobile every dialog docks to the bottom as a full-width sheet — one override converts
  // Dialog, BareDialog, and ScrollDialog alike. Rounded only along the top edge where it meets the
  // scrim; taller cap since there's no centring headroom to preserve. --kb-inset lifts the sheet
  // above the soft keyboard (which otherwise overlays it) and shrinks its cap to match, so the
  // focused field and pinned footer stay visible; it's 0 when no keyboard is open.
  [theme.media.mobile]: {
    top: 'auto',
    left: 0,
    right: 0,
    bottom: 'var(--kb-inset, 0px)',
    transform: 'none',
    width: '100%',
    maxWidth: '100%',
    maxHeight: 'calc(92vh - var(--kb-inset, 0px))',
    borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
    transition: 'bottom 0.18s ease',
    paddingBottom: $flush ? 0 : `calc(${theme.spacing(6)} + env(safe-area-inset-bottom))`,
  },
}));

// Wrapper (not styled(Text)) so the supporting copy clears the title without coupling to Text's CSS.
const Description = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

// ── ScrollDialog parts ───────────────────────────────────────────────────────
// Pinned header with a divider; never scrolls.
const ScrollHeader = styled('div')(({ theme }) => ({
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: `${theme.spacing(6)} ${theme.spacing(6)} ${theme.spacing(4)}`,
  borderBottom: `1px solid ${theme.borderSoft}`,
}));

// The only scrolling region. Fills the space between the pinned header and footer.
const ScrollBody = styled('div')(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: theme.spacing(6),
}));

// Pinned footer with a divider; holds the actions.
const ScrollFooter = styled('div')(({ theme }) => ({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
  padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
  borderTop: `1px solid ${theme.borderSoft}`,
  // Clear the home indicator when the sheet is docked to the bottom on mobile.
  [theme.media.mobile]: {
    paddingBottom: `calc(${theme.spacing(4)} + env(safe-area-inset-bottom))`,
  },
}));

// Column that holds body + footer; rendered as a <form> when onSubmit is supplied, else a <div>.
const ScrollPanel = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
});

/**
 * Modal dialog with built-in overlay, portal, and accessible title. Pass a trigger element for
 * uncontrolled usage, or omit it and manage open/onOpenChange yourself for controlled usage.
 * Use Dialog.Close to add a close button inside the dialog body.
 */
const DialogComponent = ({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: DialogProps) => (
  <Radix.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Radix.Trigger asChild>{trigger}</Radix.Trigger>}
    <Radix.Portal>
      <KeyboardInset />
      <Overlay />
      <Content>
        <Radix.Title asChild>
          <Text variant="h5">{title}</Text>
        </Radix.Title>
        {description && (
          <Radix.Description asChild>
            <Description>
              <Text variant="ui-sm" color="muted">
                {description}
              </Text>
            </Description>
          </Radix.Description>
        )}
        {children}
      </Content>
    </Radix.Portal>
  </Radix.Root>
);

export const Dialog = Object.assign(DialogComponent, { Close: Radix.Close });

/**
 * Same modal chrome as Dialog, but with no visible title row — the `title` is exposed only to the
 * accessibility tree (Radix requires a Title). Use this when the dialog needs a custom header
 * (cover, actions, bespoke layout) instead of the standard heading. Use BareDialog.Close inside.
 */
const BareDialogComponent = ({ trigger, title, children, open, onOpenChange }: BareDialogProps) => (
  <Radix.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Radix.Trigger asChild>{trigger}</Radix.Trigger>}
    <Radix.Portal>
      <KeyboardInset />
      <Overlay />
      <Content>
        <Radix.Title asChild>
          <VisuallyHidden>{title}</VisuallyHidden>
        </Radix.Title>
        {children}
      </Content>
    </Radix.Portal>
  </Radix.Root>
);

export const BareDialog = Object.assign(BareDialogComponent, { Close: Radix.Close });

/**
 * Dialog for long content: a pinned header (title + optional description, with a divider), a single
 * scrollable body, and a pinned footer for actions. Use this instead of Dialog when the body can
 * grow past the viewport (e.g. a form with many fields) so the header and actions stay in view while
 * the middle scrolls. Pass onSubmit to make it a form. Use ScrollDialog.Close inside the footer.
 */
const ScrollDialogComponent = ({
  trigger,
  title,
  description,
  footer,
  onSubmit,
  children,
  open,
  onOpenChange,
}: ScrollDialogProps) => (
  <Radix.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Radix.Trigger asChild>{trigger}</Radix.Trigger>}
    <Radix.Portal>
      <KeyboardInset />
      <Overlay />
      <Content $flush>
        <ScrollHeader>
          <Radix.Title asChild>
            <Text variant="h5">{title}</Text>
          </Radix.Title>
          {description && (
            <Radix.Description asChild>
              <Text variant="ui-sm" color="muted">
                {description}
              </Text>
            </Radix.Description>
          )}
        </ScrollHeader>
        <ScrollPanel as={onSubmit ? 'form' : 'div'} onSubmit={onSubmit}>
          <ScrollBody>{children}</ScrollBody>
          {footer && <ScrollFooter>{footer}</ScrollFooter>}
        </ScrollPanel>
      </Content>
    </Radix.Portal>
  </Radix.Root>
);

export const ScrollDialog = Object.assign(ScrollDialogComponent, { Close: Radix.Close });
