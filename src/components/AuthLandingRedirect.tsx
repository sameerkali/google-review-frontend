"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/* Skips the landing page for an already-authenticated admin/business user
   opening the installed PWA — its start_url is "/", so without this every
   launch shows the marketing page even though they're already signed in.
   Scoped to standalone/installed mode only (never a regular browser tab),
   so the public marketing site is completely unaffected for everyone else.
   Token presence only (same trust level AdminShell/BusinessProvider already
   use) — a stale/invalid token still gets caught by the normal 401 →
   sign-out flow once inside the dashboard. */
export function AuthLandingRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandalone()) return;
    try {
      if (localStorage.getItem("admin_token")) {
        router.replace("/admin/overview");
      } else if (localStorage.getItem("business_token")) {
        router.replace("/business/dashboard");
      }
    } catch {
      // localStorage unavailable (private mode etc.) — just show the landing page.
    }
  }, [router]);

  return null;
}
