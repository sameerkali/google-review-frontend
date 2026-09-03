"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Global hidden shortcut - Cmd+Shift+F (Ctrl+Shift+F on Windows/Linux) jumps
   straight to the admin login, from anywhere in the app. Ignored while
   typing in a field so it can't hijack normal text input. */
export function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.key.toLowerCase() !== "f") return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      e.preventDefault();
      router.push("/admin/login");
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
