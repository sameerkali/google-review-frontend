"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "./types";

/* Drives a server-paginated, searchable list (Businesses, Hardware, …) against
   an endpoint shaped like GET /admin/x?page=&limit=&search= → {data,total,totalPages}. */
export function usePaginatedList(endpoint: string, token: string, toast: ToastFn) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const res = await api<{ data: Row[]; total: number; totalPages: number } | Row[]>(`${endpoint}?${qs}`, { token });
      // A backend that predates server-side pagination returns a bare array —
      // fall back to treating it as one unpaginated page rather than crashing.
      if (Array.isArray(res)) {
        setRows(res);
        setTotal(res.length);
        setTotalPages(1);
      } else {
        setRows(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      toast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, token, toast, page, limit, search]);

  useEffect(() => { load(); }, [load]);

  const changeSearch = (v: string) => { setSearch(v); setPage(1); };
  const changeLimit = (v: number) => { setLimit(v); setPage(1); };

  return { rows, loading, page, setPage, limit, changeLimit, search, changeSearch, total, totalPages, reload: load };
}
