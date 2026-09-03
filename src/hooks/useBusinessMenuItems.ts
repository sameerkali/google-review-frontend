"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";

export const BUSINESS_MENU_ITEMS_KEY = ["business", "me", "menu-items"];

/* The reorder/toggle-active/set-featured trio, shared between the full menu
   manager page and the dashboard's compact "what customers see first" card
   - both need the exact same rows and the exact same optimistic mutations
   against the exact same query key, so they stay in sync with each other
   (a drag on one screen shows up correctly if you're also looking at the
   other) instead of drifting as two independent copies of this logic. */
export function useBusinessMenuItems(token: string, enabled: boolean, toast: ToastFn) {
  const queryClient = useQueryClient();
  const queryKey = BUSINESS_MENU_ITEMS_KEY;

  const { data: rows = [], isPending: loading } = useQuery({
    queryKey,
    queryFn: () => api<Row[]>("/business/me/menu-items", { token }),
    enabled,
  });

  const toggleActiveMutation = useMutation({
    mutationKey: ["business", "menu-items", "toggle-active"],
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api(`/business/me/menu-items/${id}`, { method: "PATCH", token, body: { active } }),
    meta: { toastOnError: false },
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Row[]>(queryKey);
      queryClient.setQueryData<Row[]>(queryKey, (old) => old?.map((r) => (String(r._id) === id ? { ...r, active } : r)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast("error", "Could not update that item - try again");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const setFeaturedMutation = useMutation({
    mutationKey: ["business", "menu-items", "set-featured"],
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => api(`/business/me/menu-items/${id}`, { method: "PATCH", token, body: { featured } }),
    meta: { toastOnError: false },
    onMutate: async ({ id, featured }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Row[]>(queryKey);
      queryClient.setQueryData<Row[]>(queryKey, (old) => old?.map((r) => (String(r._id) === id ? { ...r, featured } : r)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast("error", "Could not update that item - try again");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderMutation = useMutation({
    mutationKey: ["business", "menu-items", "reorder"],
    mutationFn: (orderedIds: string[]) => api("/business/me/menu-items/reorder", { method: "PATCH", token, body: { orderedIds } }),
    meta: { toastOnError: false },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Row[]>(queryKey);
      const byId = new Map((previous || []).map((r) => [String(r._id), r]));
      queryClient.setQueryData<Row[]>(queryKey, () => orderedIds.map((id) => byId.get(id)).filter((r): r is Row => !!r));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast("error", "Could not save the new order - try again");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    rows,
    loading,
    queryKey,
    reorder: (orderedIds: string[]) => reorderMutation.mutate(orderedIds),
    toggleActive: (id: string, active: boolean) => toggleActiveMutation.mutate({ id, active }),
    setFeatured: (id: string, featured: boolean) => setFeaturedMutation.mutate({ id, featured }),
  };
}
