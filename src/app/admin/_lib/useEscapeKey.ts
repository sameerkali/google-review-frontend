"use client";

import { useEffect, useRef } from "react";

/* Modals live inside a full-screen overlay that isn't itself focused, so a
   plain onKeyDown on that div never sees Escape unless focus happens to be
   inside it. Listening on the document instead makes Escape work regardless
   of where focus is.

   Modals can nest (a ConfirmDialog opened from inside another modal), so a
   shared stack ensures Escape only closes the topmost one per press instead
   of cascading through every open modal at once. */
let stack: (() => void)[] = [];

export function useEscapeKey(onEscape: () => void, enabled: boolean) {
  const cbRef = useRef(onEscape);
  useEffect(() => {
    cbRef.current = onEscape;
  });

  useEffect(() => {
    if (!enabled) return;
    const entry = () => cbRef.current();
    stack.push(entry);

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (stack[stack.length - 1] === entry) entry();
    };
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
      stack = stack.filter((fn) => fn !== entry);
    };
  }, [enabled]);
}
