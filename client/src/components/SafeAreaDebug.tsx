import { useEffect, useState } from 'react';

/**
 * TEMPORARY diagnostic overlay for the bottom-nav safe-area investigation. Grabs the *fixed* nav
 * (the BottomNav — not the hidden full-height Sidebar rail, which is also a <nav>), outlines it, and
 * reports whether it actually reaches the physical bottom edge plus what element sits at the very
 * bottom pixel. Readable off a screenshot, no devtools. REMOVE once the spacing is settled.
 */
export const SafeAreaDebug = () => {
  const [info, setInfo] = useState('measuring…');

  useEffect(() => {
    const read = () => {
      // Raw env() inset, measured independently of any element.
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom);';
      document.body.appendChild(probe);
      const insetEnv = probe.getBoundingClientRect().height;
      probe.remove();

      // The BottomNav is the only position:fixed <nav>; the Sidebar rail is full-height/static.
      const navs = Array.from(document.querySelectorAll('nav'));
      const nav = navs.find((n) => getComputedStyle(n).position === 'fixed') ?? navs.at(-1);
      if (!nav) {
        setInfo('no fixed <nav> found');
        return;
      }
      const cs = getComputedStyle(nav);
      const r = nav.getBoundingClientRect();
      const winH = window.innerHeight;
      const winW = window.innerWidth;
      const gapBelowNav = winH - r.bottom;

      // Outline the real nav so its box is visible in the screenshot.
      (nav as HTMLElement).style.outline = '3px solid magenta';
      (nav as HTMLElement).style.outlineOffset = '-3px';

      // What element actually occupies the very bottom-centre pixel?
      const bottomEl = document.elementFromPoint(winW / 2, winH - 2);
      const bottomDesc = bottomEl
        ? `${bottomEl.tagName.toLowerCase()}${bottomEl === nav ? '(=NAV)' : '(NOT nav)'}`
        : 'none';

      setInfo(
        [
          `inset(env)=${insetEnv.toFixed(0)}`,
          `navH=${cs.height}`,
          `navPadB=${cs.paddingBottom}`,
          `navBottom=${r.bottom.toFixed(0)}`,
          `innerH=${winH}`,
          `gapBelowNav=${gapBelowNav.toFixed(0)}`,
          `reachesEdge=${Math.abs(gapBelowNav) < 1 ? 'YES' : 'NO'}`,
          `bottomPixel=${bottomDesc}`,
        ].join('   ')
      );
    };

    read();
    window.addEventListener('resize', read);
    window.visualViewport?.addEventListener('resize', read);
    return () => {
      window.removeEventListener('resize', read);
      window.visualViewport?.removeEventListener('resize', read);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 4px)',
        left: 4,
        right: 4,
        zIndex: 99999,
        background: 'rgba(178, 58, 46, 0.92)',
        color: '#fff',
        font: '11px/1.45 ui-monospace, monospace',
        padding: '6px 8px',
        borderRadius: 6,
        whiteSpace: 'pre-wrap',
        pointerEvents: 'none',
      }}
    >
      {info}
    </div>
  );
};
