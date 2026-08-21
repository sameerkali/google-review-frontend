"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../_lib/context";
import type { Row, ToastFn } from "../_lib/types";
import { DataTable } from "../_components/DataTable";
import { Pagination } from "../_components/Pagination";
import { BulkReviewUploadModal } from "../_components/BulkReviewUploadModal";
import { Spinner } from "../_components/Loaders";
import { AlertIcon, PlusIcon, UploadIcon } from "../_lib/icons";
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
  token, toast, onSelect, onBulkOpen, refreshToken,
}: {
  token: string;
  toast: ToastFn;
  onSelect: (b: BizSummary) => void;
  onBulkOpen: () => void;
  /** Bumped after a bulk upload so the per-business counts below reflect it. */
  refreshToken: number;
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

  useEffect(() => { load(); }, [load, refreshToken]);

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
const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "unused", label: "Unused" },
  { value: "reserved", label: "Reserved" },
  { value: "used", label: "Used" },
] as const;

function ReviewList({
  biz, token, toast, onBack, onAdded,
}: {
  biz: BizSummary;
  token: string;
  toast: ToastFn;
  onBack: () => void;
  /** Called after a comment is added here, so the business-list counts stay in sync. */
  onAdded: () => void;
}) {
  const [rows, setRows]           = useState<Row[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(25);
  const [status, setStatus]       = useState<typeof STATUSES[number]["value"]>("");

  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [addErr, setAddErr] = useState("");
  const [saving, setSaving] = useState(false);

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
  const changeStatus = (v: typeof STATUSES[number]["value"]) => { setStatus(v); setPage(1); };

  const addComment = async () => {
    if (!newText.trim()) { setAddErr("Comment text is required"); return; }
    setAddErr("");
    setSaving(true);
    try {
      await api("/admin/review-suggestions", { method: "POST", token, body: { businessId: biz._id, reviewText: newText.trim() } });
      toast("success", "Comment added");
      setNewText("");
      setShowAdd(false);
      await load();
      onAdded();
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : "Could not add comment");
    } finally {
      setSaving(false);
    }
  };

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
            onChange={(e) => changeStatus(e.target.value as typeof STATUSES[number]["value"])}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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

          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
          >
            <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showAdd ? "rotate-45" : ""}`} strokeWidth={2} />
            {showAdd ? "Cancel" : "Add Comment"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <label htmlFor="new-comment" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Comment Text</label>
          <textarea
            id="new-comment"
            value={newText}
            onChange={(e) => { setNewText(e.target.value); if (addErr) setAddErr(""); }}
            placeholder="Great coffee and quick service!"
            rows={3}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
              addErr ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            }`}
          />
          {addErr && (
            <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
              <AlertIcon className="w-3 h-3 shrink-0" />
              {addErr}
            </p>
          )}
          <button
            onClick={addComment}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? <><Spinner /> Saving…</> : "Save Comment"}
          </button>
        </div>
      )}

      <DataTable
        rows={rows}
        cols={["reviewText", "status", "createdAt"]}
        loading={loading}
        toast={toast}
      />

      {!loading && <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />}
    </div>
  );
}

// ── Root page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { data, token, toast, refresh } = useAdmin();
  const [selected, setSelected] = useState<BizSummary | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  return (
    <>
      {selected ? (
        <ReviewList
          biz={selected}
          token={token}
          toast={toast}
          onBack={() => setSelected(null)}
          onAdded={() => setListVersion((v) => v + 1)}
        />
      ) : (
        <BusinessList
          token={token}
          toast={toast}
          onSelect={setSelected}
          onBulkOpen={() => setBulkOpen(true)}
          refreshToken={listVersion}
        />
      )}
      <BulkReviewUploadModal
        open={bulkOpen}
        businesses={(data.b as Row[]) || []}
        token={token}
        onClose={() => setBulkOpen(false)}
        onRefresh={async () => { await refresh(); setListVersion((v) => v + 1); }}
        toast={toast}
      />
    </>
  );
}
