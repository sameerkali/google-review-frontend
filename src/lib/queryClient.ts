import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { notifyToast, portalFromKey, triggerSignOut } from "@/lib/authBridge";

/* Retries transient/network/5xx failures with a short capped backoff; never
   retries a 4xx ApiError (401/403/404/409/422 etc.) - retrying a doomed
   request just delays the error feedback the UI is waiting to show. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500 && failureCount < 2;
  }
  return failureCount < 2;
}

const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 4000);

function handleError(error: unknown, key: readonly unknown[] | undefined, silent: boolean) {
  const portal = key ? portalFromKey(key) : null;
  if (error instanceof ApiError && error.status === 401) {
    if (portal) triggerSignOut(portal);
    return;
  }
  // A business account can be suspended/deleted by an admin mid-session -
  // every business route now re-checks status on each request (not just at
  // login), so this can arrive on any authenticated call. Always surface
  // the server's own message (ignores `silent`) so a customer-facing owner
  // knows why they were just signed out, instead of landing back on the
  // login screen with no explanation.
  //
  // Not every business-portal 403 means that, though - the dashboard's
  // tier-gated endpoints (e.g. a "none"-tier business hitting the summary
  // route) also 403, on purpose, and the dashboard page already renders its
  // own free-tier UI for that via `meta: { silent: true }`. Both responses
  // carry an explicit `reason` field (`"suspended"` vs `"tier"`, see
  // middleware/auth.js and businessDashboard.js's requireTier()) so this
  // checks that directly instead of inferring it from an incidental field.
  if (error instanceof ApiError && error.status === 403 && portal === "business") {
    const body = error.body as { reason?: string } | null;
    if (body?.reason === "suspended") {
      triggerSignOut("business");
      notifyToast("business", "error", error.message || "This account is no longer active. Contact your platform admin.");
      return;
    }
  }
  if (silent) return;
  notifyToast(portal, "error", error instanceof Error ? error.message : "Something went wrong");
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        handleError(error, query.queryKey, query.meta?.silent === true);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        handleError(error, mutation.options.mutationKey, mutation.meta?.toastOnError === false);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: shouldRetry,
        retryDelay,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
