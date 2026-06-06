import { useEffect, useState } from 'react';

/**
 * TEMPORARY diagnostic overlay for the bottom-nav safe-area investigation. Reads the real device
 * geometry and prints it on screen so it can be read off a screenshot (no devtools needed).
 * REMOVE once the bottom-nav spacing is settled — this is not shippable UI.
 */
export const SafeAreaDebug = () => {
  const [info, setInfo] = useState('measuring…');

  useEffect(() => {
    const read = () => {
      // Probe the raw env() inset independently of the nav.
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom);';
      document.body.appendChild(probe);
      const insetEnv = probe.getBoundingClientRect().height;
      probe.remove();

      const nav = document.querySelector('nav');
      if (!nav) {
        setInfo('no <nav> found');
        return;
      }
      const cs = getComputedStyle(nav);
      const r = nav.getBoundingClientRect();
      const winH = window.innerHeight;
      const vvH = window.visualViewport?.height ?? winH;
      const gapBelowNav = winH - r.bottom;

      setInfo(
        [
          `inset(env)=${insetEnv.toFixed(1)}`,
          `navPadBottom=${cs.paddingBottom}`,
          `navHeight=${cs.height}`,
          `navTop=${r.top.toFixed(1)}`,
          `navBottom=${r.bottom.toFixed(1)}`,
          `innerHeight=${winH}`,
          `visualVP=${vvH.toFixed(1)}`,
          `gapBelowNav=${gapBelowNav.toFixed(1)}`,
          `reachesEdge=${Math.abs(gapBelowNav) < 1 ? 'YES' : 'NO'}`,
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
