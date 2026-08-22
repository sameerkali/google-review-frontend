import type { ToastFn } from "@/lib/types";

/* The QueryClient is created above AdminProvider/BusinessProvider (in the
   root layout), so its global onError handlers can't reach the real,
   React-scoped signOut()/toast() functions (localStorage clear + router
   redirect; toast queue state) directly. Each provider registers its own
   on mount; the QueryClient's onError looks up the matching portal by the
   query/mutation key's first segment and calls through here instead. */
type SignOutFn = () => void;
type Portal = "admin" | "business";

let adminSignOut: SignOutFn | null = null;
let businessSignOut: SignOutFn | null = null;
let adminToast: ToastFn | null = null;
let businessToast: ToastFn | null = null;

export function registerAdminSignOut(fn: SignOutFn) {
  adminSignOut = fn;
}

export function registerBusinessSignOut(fn: SignOutFn) {
  businessSignOut = fn;
}

export function registerAdminToast(fn: ToastFn) {
  adminToast = fn;
}

export function registerBusinessToast(fn: ToastFn) {
  businessToast = fn;
}

export function triggerSignOut(portal: Portal) {
  (portal === "admin" ? adminSignOut : businessSignOut)?.();
}

export function notifyToast(portal: Portal | null, kind: Parameters<ToastFn>[0], msg: string) {
  if (portal === "admin") adminToast?.(kind, msg);
  else if (portal === "business") businessToast?.(kind, msg);
}

/** First segment of a query/mutation key tells us which portal's bridge to use. */
export function portalFromKey(key: readonly unknown[]): Portal | null {
  if (key[0] === "admin") return "admin";
  if (key[0] === "business") return "business";
  return null;
}
