"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "./types";

/* Drives a server-paginated, searchable list (Businesses, Hardware, Analytics, …)
   against an endpoint shaped like GET /admin/x?page=&limit=&search= → {data,total,totalPages}.
   extraParams lets a caller add filters (e.g. businessId, sort) that reset the page like search does. */
export function usePaginatedList(
  endpoint: string,
  token: string,
  toast: ToastFn,
  opts?: { defaultLimit?: number; extraParams?: Record<string, string> }
) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(opts?.defaultLimit ?? 25);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // The full last response, for callers that need more than rows (e.g. Analytics' summary block).
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const extraKey = JSON.stringify(opts?.extraParams || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...JSON.parse(extraKey),
      });
      const res = await api<({ data: Row[]; total: number; totalPages: number } & Record<string, unknown>) | Row[]>(`${endpoint}?${qs}`, { token });
      if (Array.isArray(res)) {
        // A backend that predates server-side pagination ignores page/limit/search and
        // returns everything — apply both client-side against the full list it gave us,
        // rather than showing the whole thing regardless of what was picked.
        const term = search.trim().toLowerCase();
        const filtered = term ? res.filter((r) => JSON.stringify(r).toLowerCase().includes(term)) : res;
        const start = (page - 1) * limit;
        setRows(filtered.slice(start, start + limit));
        setTotal(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
        setMeta({});
      } else {
        setRows(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setMeta(res);
      }
    } catch {
      toast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, token, toast, page, limit, search, extraKey]);

  useEffect(() => { load(); }, [load]);

  const changeSearch = (v: string) => { setSearch(v); setPage(1); };
  const changeLimit = (v: number) => { setLimit(v); setPage(1); };

  return { rows, loading, page, setPage, limit, changeLimit, search, changeSearch, total, totalPages, meta, reload: load };
}
