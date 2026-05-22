import { useState } from 'react';
import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Overlay, Content, Backdrop, Image, VisuallyHidden } from './Lightbox.styles';

interface LightboxProps {
  /** Sources tried in order — falls back to the next on error. */
  srcs: string[];
  alt: string;
  children: ReactNode;
}

/**
 * Wraps any element as a trigger that opens a fullscreen image viewer on click. Built on Radix
 * Dialog so Escape and click-outside both close it, and focus is trapped while open. Pass multiple
 * srcs in descending quality order — the component tries each one and falls back on error. The
 * title is visually hidden but present for screen readers.
 */
export const Lightbox = ({ srcs, alt, children }: LightboxProps) => {
  const [index, setIndex] = useState(0);
  const src = srcs[index];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <Content>
          <VisuallyHidden>
            <Dialog.Title>{alt}</Dialog.Title>
          </VisuallyHidden>
          <Dialog.Close asChild>
            <Backdrop aria-label="Close" />
          </Dialog.Close>
          {src && <Image src={src} alt={alt} onError={() => setIndex((i) => i + 1)} />}
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
