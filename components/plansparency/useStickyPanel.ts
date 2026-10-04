'use client';

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Measures a tab's scroll area, its sticky header bar and its layout container so a
// side panel can stay centered in the visible area while the page scrolls.
//   twoCol: the layout is wide enough for the main column and the panel side by side
//   top:    where the sticky panel sticks (below the header bar)
//   height: the visible height available to the panel
//   headerH: the sticky header bar's height (for scroll margins)
// `watch` changes whenever the tab is shown, so the observers attach once the elements exist.
export function useStickyPanel(
  scrollRef: RefObject<HTMLElement | null>,
  headerRef: RefObject<HTMLElement | null>,
  layoutRef: RefObject<HTMLElement | null>,
  watch: string
) {
  const [m, setM] = useState({ twoCol: false, top: 0, height: 0, headerH: 0 });

  useEffect(() => {
    const sc = scrollRef.current;
    const hd = headerRef.current;
    const ly = layoutRef.current;
    if (!sc || !hd || !ly || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const headerH = hd.offsetHeight;
      setM({ twoCol: ly.clientWidth >= 900, top: headerH + 16, height: Math.max(0, sc.clientHeight - headerH - 32), headerH });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sc);
    ro.observe(hd);
    ro.observe(ly);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return m;
}
