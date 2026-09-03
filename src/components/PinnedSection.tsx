"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Pins its children to the viewport (fixed, low z-index) while a same-height
   spacer holds their place in normal document flow - so whatever comes
   after in the page scrolls up and visually covers this section instead of
   scrolling it away with the rest of the page. Height is measured from the
   rendered content itself, not assumed, so it stays correct across
   breakpoints without forcing the hero to a fixed viewport height. */
export function PinnedSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // The browser restores scroll position on reload/back-forward navigation
  // by default - landing mid-page here would show the hero already covered,
  // looking exactly like it's missing rather than like intended scroll
  // behavior. This page's hero should always be visible on a fresh load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

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
