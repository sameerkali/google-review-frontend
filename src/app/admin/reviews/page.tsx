"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../_lib/context";
import type { Row, ToastFn } from "../_lib/types";
import { DataTable } from "../_components/DataTable";
import { BulkReviewUploadModal } from "../_components/BulkReviewUploadModal";
import { Spinner } from "../_components/Loaders";
import { UploadIcon } from "../_lib/icons";
import { api } from "@/lib/api";

// ── Business list ────────────────────────────────────────────────────────────

interface BizSummary {
  _id: string;
  name: string;
  email: string;
  status: string;
  total: number;
  unused: number;
  reserved: number;
  used: number;
}

function BusinessList({
  token, toast, onSelect, onBulkOpen, businesses,
}: {
  token: string;
  toast: ToastFn;
  onSelect: (b: BizSummary) => void;
  onBulkOpen: () => void;
  businesses: Row[];
}) {
  const [rows, setRows] = useState<BizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<BizSummary[]>("/admin/reviews/businesses", { token });
      setRows(data);
    } catch {
      toast("error", "Failed to load review summary");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { load(); }, [load]);

  const badge = (n: number, color: string) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {n}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Review Suggestion Management</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading ? "Loading…" : `${rows.length} business${rows.length !== 1 ? "es" : ""} with reviews`}
          </p>
        </div>
        <button
          onClick={onBulkOpen}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer self-start sm:self-auto"
        >
          <UploadIcon className="w-4 h-4" />
          Upload JSON
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-sm text-zinc-500">No review suggestions yet</p>
          <p className="text-xs text-zinc-600 mt-1">Upload a JSON file to get started</p>
        </div>
      ) : (
        <>
          {/* Card — mobile */}
          <div className="space-y-3 sm:hidden">
            {rows.map((b) => (
              <button
                key={b._id}
                onClick={() => onSelect(b)}
                className="w-full text-left rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2.5 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{b.name}</span>
                  <span className="text-xs text-zinc-400">{b.total} total</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badge(b.unused,   "bg-zinc-700 text-zinc-300")}
                  {badge(b.reserved, "bg-amber-500/15 text-amber-400")}
                  {badge(b.used,     "bg-emerald-500/15 text-emerald-400")}
                  <span className="text-xs text-zinc-600">unused / reserved / used</span>
                </div>
              </button>
            ))}
          </div>

          {/* Table — sm+ */}
          <div className="hidden sm:block rounded-2xl border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800">
                  {["Business", "Email", "Unused", "Reserved", "Used", "Total"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b._id}
                    onClick={() => onSelect(b)}
                    className="border-b border-zinc-800 hover:bg-zinc-900/70 transition-colors duration-100 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-zinc-200 font-medium whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{b.email}</td>
                    <td className="px-4 py-3">{badge(b.unused,   "bg-zinc-700 text-zinc-300")}</td>
                    <td className="px-4 py-3">{badge(b.reserved, "bg-amber-500/15 text-amber-400")}</td>
                    <td className="px-4 py-3">{badge(b.used,     "bg-emerald-500/15 text-emerald-400")}</td>
                    <td className="px-4 py-3 text-zinc-300 font-semibold">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Paginated review list for one business ───────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100];
const STATUSES = ["", "unused", "reserved", "used"] as const;

function ReviewList({
  biz, token, toast, onBack,
}: {
  biz: BizSummary;
  token: string;
  toast: ToastFn;
  onBack: () => void;
}) {
  const [rows, setRows]           = useState<Row[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(25);
  const [status, setStatus]       = useState<typeof STATUSES[number]>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        businessId: biz._id,
        page: String(page),
        limit: String(limit),
        ...(status ? { status } : {}),
      });
      const res = await api<{ data: Row[]; total: number; totalPages: number }>(
        `/admin/reviews?${qs}`,
        { token }
      );
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast("error", "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [biz._id, token, toast, page, limit, status]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filter/limit changes
  const changeLimit = (v: number) => { setLimit(v); setPage(1); };
  const changeStatus = (v: typeof STATUSES[number]) => { setStatus(v); setPage(1); };

  const PageBtn = ({ n, disabled, children }: { n?: number; disabled?: boolean; children: React.ReactNode }) => (
    <button
      onClick={() => n !== undefined && setPage(n)}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        n === page
          ? "bg-emerald-500 text-zinc-950"
          : "border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">{biz.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{total} review{total !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => changeStatus(e.target.value as typeof STATUSES[number])}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="">All statuses</option>
            <option value="unused">Unused</option>
            <option value="reserved">Reserved</option>
            <option value="used">Used</option>
          </select>

          {/* Page size */}
          <select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} per page</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        rows={rows}
        cols={["reviewText", "status", "createdAt"]}
        loading={loading}
        toast={toast}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-zinc-500">
            Page {page} of {totalPages} · {total} result{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <PageBtn n={page - 1} disabled={page <= 1}>← Prev</PageBtn>
            {/* Show at most 5 page buttons around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce<(number | "…")[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="px-2 text-zinc-600 text-xs">…</span>
                ) : (
                  <PageBtn key={n} n={n as number}>{n}</PageBtn>
                )
              )}
            <PageBtn n={page + 1} disabled={page >= totalPages}>Next →</PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { data, token, toast, refresh } = useAdmin();
  const [selected, setSelected] = useState<BizSummary | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <>
      {selected ? (
        <ReviewList
          biz={selected}
          token={token}
          toast={toast}
          onBack={() => setSelected(null)}
        />
      ) : (
        <BusinessList
          token={token}
          toast={toast}
          onSelect={setSelected}
          onBulkOpen={() => setBulkOpen(true)}
          businesses={(data.b as Row[]) || []}
        />
      )}
      <BulkReviewUploadModal
        open={bulkOpen}
        businesses={(data.b as Row[]) || []}
        token={token}
        onClose={() => setBulkOpen(false)}
        onRefresh={refresh}
        toast={toast}
      />
    </>
  );
}
