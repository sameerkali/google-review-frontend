"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";

type ListResponse = { data: Row[]; total: number; totalPages: number } & Record<string, unknown>;

/* Drives a server-paginated, searchable list (Businesses, Hardware, Analytics, …)
   against an endpoint shaped like GET /admin/x?page=&limit=&search= → {data,total,totalPages}.
   extraParams lets a caller add filters (e.g. businessId, sort) that reset the page like search does. */
export function usePaginatedList(
  keyBase: readonly unknown[],
  endpoint: string,
  token: string,
  toast: ToastFn,
  opts?: { defaultLimit?: number; extraParams?: Record<string, string> }
) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(opts?.defaultLimit ?? 25);
  const [search, setSearch] = useState("");
  const extraParams = opts?.extraParams || {};
  const extraKey = JSON.stringify(extraParams);

  const { data, isPending } = useQuery({
    queryKey: [...keyBase, { page, limit, search, ...extraParams }],
    queryFn: async (): Promise<ListResponse> => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...JSON.parse(extraKey),
      });
      const res = await api<ListResponse | Row[]>(`${endpoint}?${qs}`, { token });
      if (!Array.isArray(res)) return res;
      // A backend that predates server-side pagination ignores page/limit/search and
      // returns everything — apply both client-side against the full list it gave us,
      // rather than showing the whole thing regardless of what was picked.
      const term = search.trim().toLowerCase();
      const filtered = term ? res.filter((r) => JSON.stringify(r).toLowerCase().includes(term)) : res;
      const start = (page - 1) * limit;
      return {
        data: filtered.slice(start, start + limit),
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      };
    },
    enabled: !!token,
    placeholderData: keepPreviousData, // old page stays visible instead of flashing a skeleton
    meta: { silent: false },
  });

  const changeSearch = (v: string) => { setSearch(v); setPage(1); };
  const changeLimit = (v: number) => { setLimit(v); setPage(1); };

  return {
    rows: data?.data ?? [],
    loading: isPending,
    page, setPage,
    limit, changeLimit,
    search, changeSearch,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    meta: (data ?? {}) as Record<string, unknown>,
    reload: () => {}, // superseded by direct queryClient.invalidateQueries after mutations
  };
}
