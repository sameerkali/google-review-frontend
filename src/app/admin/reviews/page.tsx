"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../_lib/context";
import type { Row, ToastFn } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { BulkReviewUploadModal } from "../_components/BulkReviewUploadModal";
import { AlertIcon, PlusIcon, UploadIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Loaders";
import { Button } from "@/components/ui/Button";
import { Label, Select, Textarea } from "@/components/ui/Input";

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
          <h2 className="text-lg font-semibold text-fg">Review Suggestion Management</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">
            {loading ? "Loading…" : `${rows.length} business${rows.length !== 1 ? "es" : ""} with reviews`}
          </p>
        </div>
        <Button variant="secondary" onClick={onBulkOpen} className="self-start sm:self-auto">
          <UploadIcon className="w-4 h-4" />
          Upload JSON
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-sm text-fg-tertiary">No review suggestions yet</p>
          <p className="text-xs text-fg-quaternary mt-1">Upload a JSON file to get started</p>
        </div>
      ) : (
        <>
          {/* Card — mobile */}
          <div className="space-y-3 sm:hidden">
            {rows.map((b) => (
              <button
                key={b._id}
                onClick={() => onSelect(b)}
                className="w-full text-left rounded-2xl border border-border bg-surface p-4 space-y-2.5 hover:border-border-strong transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-fg">{b.name}</span>
                  <span className="text-xs text-fg-tertiary">{b.total} total</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badge(b.unused,   "bg-surface-inset text-fg-tertiary")}
                  {badge(b.reserved, "bg-warning/15 text-warning")}
                  {badge(b.used,     "bg-success/15 text-success")}
                  <span className="text-xs text-fg-quaternary">unused / reserved / used</span>
                </div>
              </button>
            ))}
          </div>

          {/* Table — sm+ */}
          <div className="hidden sm:block rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  {["Business", "Email", "Unused", "Reserved", "Used", "Total"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-fg-tertiary uppercase tracking-wider whitespace-nowrap">
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
                    className="border-b border-border hover:bg-surface/70 transition-colors duration-100 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-fg-secondary font-medium whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-3 text-fg-tertiary whitespace-nowrap">{b.email}</td>
                    <td className="px-4 py-3">{badge(b.unused,   "bg-surface-inset text-fg-tertiary")}</td>
                    <td className="px-4 py-3">{badge(b.reserved, "bg-warning/15 text-warning")}</td>
                    <td className="px-4 py-3">{badge(b.used,     "bg-success/15 text-success")}</td>
                    <td className="px-4 py-3 text-fg-secondary font-semibold">{b.total}</td>
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
          <Button variant="secondary" size="sm" onClick={onBack}>← Back</Button>
          <div>
            <h2 className="text-lg font-semibold text-fg">{biz.name}</h2>
            <p className="text-sm text-fg-tertiary mt-0.5">{total} review{total !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <Select
            value={status}
            onChange={(e) => changeStatus(e.target.value as typeof STATUSES[number]["value"])}
            className="py-1.5! text-xs cursor-pointer w-auto"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>

          {/* Page size */}
          <Select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="py-1.5! text-xs cursor-pointer w-auto"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} per page</option>
            ))}
          </Select>

          <Button variant="primary" onClick={() => setShowAdd((v) => !v)}>
            <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showAdd ? "rotate-45" : ""}`} />
            {showAdd ? "Cancel" : "Add Comment"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3 animate-scale-in">
          <Label htmlFor="new-comment">Comment Text</Label>
          <Textarea
            id="new-comment"
            value={newText}
            onChange={(e) => { setNewText(e.target.value); if (addErr) setAddErr(""); }}
            placeholder="Great coffee and quick service!"
            rows={3}
            error={!!addErr}
          />
          {addErr && (
            <p role="alert" className="flex items-center gap-1 text-xs text-danger">
              <AlertIcon className="w-3 h-3 shrink-0" />
              {addErr}
            </p>
          )}
          <Button variant="primary" onClick={addComment} loading={saving} loadingText="Saving…">
            Save Comment
          </Button>
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
