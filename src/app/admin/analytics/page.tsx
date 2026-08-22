"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "@/lib/types";
import { usePaginatedList } from "../_lib/usePaginatedList";
import { Skeleton } from "@/components/Loaders";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { Select } from "@/components/ui/Input";

const PAGE_SIZES = [10, 25, 50, 100];

export default function AnalyticsPage() {
  const { token, authChecked, toast } = useAdmin();
  const { data: businesses = [] } = useQuery({
    queryKey: ["admin", "businesses", "all"],
    queryFn: () => api<Row[]>("/admin/business", { token }),
    enabled: authChecked && !!token,
  });

  const [businessId, setBusinessId] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const list = usePaginatedList(["admin", "analytics", "list"], "/admin/analytics", token, toast, {
    defaultLimit: 50,
    extraParams: { ...(businessId ? { businessId } : {}), sort },
  });

  const changeBusiness = (v: string) => { setBusinessId(v); list.setPage(1); };
  const changeSort = (v: "desc" | "asc") => { setSort(v); list.setPage(1); };

  const summary = (list.meta.summary as { total: number; byType: Record<string, number> } | undefined);
  const statCards = summary
    ? [
        { label: "Total Scans", value: summary.byType?.scan ?? 0 },
        { label: "Google Clicks", value: summary.byType?.google_click ?? 0 },
        { label: "Review Copies", value: summary.byType?.review_copy ?? 0 },
        { label: "Total Events", value: summary.total ?? 0 },
      ]
    : [];

  // Populated businessId (an object) → flatten to a plain "business" column
  // the shared DataTable can render, instead of showing raw ids or [object Object].
  const rows = list.rows.map((e) => ({
    ...e,
    business: e.businessId && typeof e.businessId === "object" ? e.businessId.name : "—",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Analytics</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">Track QR interactions and engagement</p>
      </div>

      {list.loading && !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-5 space-y-2">
              <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">{label}</p>
              <p className="text-3xl font-bold text-fg font-mono tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-tertiary">{list.total} event{list.total !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={businessId} onChange={(e) => changeBusiness(e.target.value)} className="py-1.5! text-xs cursor-pointer w-auto">
            <option value="">All businesses</option>
            {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => changeSort(e.target.value as "desc" | "asc")} className="py-1.5! text-xs cursor-pointer w-auto">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
          <Select value={list.limit} onChange={(e) => list.changeLimit(Number(e.target.value))} className="py-1.5! text-xs cursor-pointer w-auto">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
          </Select>
        </div>
      </div>

      <DataTable rows={rows} cols={["business", "eventType", "code", "device", "browser", "os", "createdAt"]} loading={list.loading} />

      {!list.loading && <Pagination page={list.page} totalPages={list.totalPages} total={list.total} onChange={list.setPage} />}
    </div>
  );
}
