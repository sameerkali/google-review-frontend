"use client";

import { useEffect, useRef, useState } from "react";

/* A small, contained scroll-scrubbed effect (not a video, not a loop): a
   scan line tracks scroll position as this element passes through the
   viewport, like a video being scrubbed by hand rather than played. Confined
   to whatever it wraps — meant for the hero's photo+QR composition only,
   not the whole page. */
export function QrScanScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [enabled] = useState(
    () => typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const p = (vh - rect.top) / total;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  const edgeFade = Math.min(progress, 1 - progress) * 8;
  const lineOpacity = enabled ? Math.max(0, Math.min(1, edgeFade)) : 0;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute left-3 right-3 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
        style={{
          top: `${progress * 100}%`,
          opacity: lineOpacity,
          boxShadow: "0 0 10px 1px color-mix(in srgb, var(--color-brand) 70%, transparent)",
        }}
      />
    </div>
  );
}
