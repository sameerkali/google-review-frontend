import type { QueryClient } from "@tanstack/react-query";

/** Every place that changes a hardware row (add, edit, link/unlink a QR,
    delete) needs to invalidate the same three caches - the list view, the
    "all" list other pages read for lookups, and Overview's stock summary.
    Keeping that trio in one place means a fourth dependent cache, if one's
    ever added, only needs updating here. */
export function invalidateHardwareQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "list"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "all"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
}
