"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/icons";

/* Catches a render-time exception anywhere below the root layout - without
   this, one thrown error (a bad response shape, an assumption that turned
   out false) white-screens the whole app instead of showing a recoverable
   "something broke" screen. See app/global-error.tsx for the rarer case of
   the root layout itself failing. */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // The only signal available client-side today; wiring a real error-
    // tracking service here is the natural next step.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-3 max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-1">
          <AlertIcon className="w-6 h-6 text-danger" />
        </div>
        <p className="text-fg-secondary text-lg font-medium">Something went wrong</p>
        <p className="text-fg-tertiary text-sm">
          An unexpected error occurred. Try again, or reload the page if it keeps happening.
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-full bg-brand hover:bg-brand-hover px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
