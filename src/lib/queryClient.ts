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
