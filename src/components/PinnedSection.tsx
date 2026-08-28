"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Pins its children to the viewport (fixed, low z-index) while a same-height
   spacer holds their place in normal document flow — so whatever comes
   after in the page scrolls up and visually covers this section instead of
   scrolling it away with the rest of the page. Height is measured from the
   rendered content itself, not assumed, so it stays correct across
   breakpoints without forcing the hero to a fixed viewport height. */
export function PinnedSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div ref={ref} className="fixed inset-x-0 top-0 z-0">
        {children}
      </div>
      <div style={{ height }} aria-hidden="true" />
    </>
  );
}
