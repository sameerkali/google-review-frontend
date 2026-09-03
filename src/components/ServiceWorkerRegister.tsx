"use client";

import { useEffect } from "react";

/* Registered in production only - a service worker intercepting fetches
   during `next dev` fights Turbopack's own HMR/fast-refresh requests. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
