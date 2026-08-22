"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "left" | "right";

const HIDDEN: Record<Direction, string> = {
  up: "opacity-0 translate-y-10",
  left: "opacity-0 -translate-x-10",
  right: "opacity-0 translate-x-10",
};

/* Scroll-triggered reveal: fades/slides content in once it enters the
   viewport. IntersectionObserver only (no scroll-position listeners, no
   layout-affecting properties) and honors prefers-reduced-motion via the
   .animate-reveal / .reveal-hidden classes defined in globals.css. */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Reduced-motion users get the content immediately, no hidden state at all
  // (not just an instant transition) — a pop-in is still motion. Read via
  // the state initializer rather than an effect, since setState directly in
  // an effect body triggers an avoidable extra render.
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : HIDDEN[direction]} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
