import { useEffect } from 'react';

// How far the on-screen keyboard overlaps the bottom of the layout viewport. iOS keeps fixed
// elements pinned to the (unshrunk) layout viewport when the keyboard opens, so a bottom-docked
// sheet would sit behind the keyboard along with its pinned footer. We measure the overlap from the
// visual viewport and expose it as --kb-inset; the sheet lifts by that amount and caps its height to
// match. Mounted only while a dialog is open, so the listener and the variable reset on close.
const setInset = () => {
  const vv = window.visualViewport;
  if (!vv) return;
  const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  document.documentElement.style.setProperty('--kb-inset', `${inset}px`);
};

/**
 * Null-rendering tracker that keeps the --kb-inset CSS variable in sync with the soft keyboard while
 * a dialog is mounted. Rendered inside each Dialog portal so the listener is scoped to open dialogs
 * and the variable is cleared on close.
 */
export const KeyboardInset = () => {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    setInset();
    vv.addEventListener('resize', setInset);
    vv.addEventListener('scroll', setInset);
    return () => {
      vv.removeEventListener('resize', setInset);
      vv.removeEventListener('scroll', setInset);
      document.documentElement.style.removeProperty('--kb-inset');
    };
  }, []);

  return null;
};
