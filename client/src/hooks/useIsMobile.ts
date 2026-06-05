import { useSyncExternalStore } from 'react';
import { MOBILE_BREAKPOINT } from '@livre/ui';

const query = `(max-width: ${MOBILE_BREAKPOINT}px)`;

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

/**
 * Reactive phone-breakpoint check, sharing the single MOBILE_BREAKPOINT source of truth with the CSS
 * `theme.media.mobile` token. Reserved for the rare cases where the difference is structural rather
 * than stylistic — a node that must mount in a different place on mobile (e.g. the book journal,
 * which becomes a sheet dialog) — not for layout that CSS media queries already handle.
 */
export const useIsMobile = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
