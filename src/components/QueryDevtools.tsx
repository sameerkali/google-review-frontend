"use client";

import dynamic from "next/dynamic";

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
  { ssr: false }
);

/* Dev-only: the dynamic import above never executes outside development, so
   the devtools chunk is never requested (and never shipped) in production. */
export function QueryDevtools() {
  if (process.env.NODE_ENV !== "development") return null;
  return <ReactQueryDevtools initialIsOpen={false} />;
}
