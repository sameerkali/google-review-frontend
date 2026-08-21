"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "../_lib/context";
import type { Row } from "../../admin/_lib/types";
import { DataTable } from "../../admin/_components/DataTable";
import { ConfirmDialog } from "../../admin/_components/ConfirmDialog";
import { Spinner } from "../../admin/_components/Loaders";
import { AlertIcon, PlusIcon } from "../../admin/_lib/icons";

export default function BusinessReviewsPage() {
  const { token, toast } = useBusiness();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api<Row[]>("/business/me/reviews", { token }));
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Failed to load your reviews");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { load(); }, [load]);

  const addComment = async () => {
    if (!text.trim()) { setError("Comment text is required"); return; }
    setError("");
    setSaving(true);
    try {
      await api("/business/me/reviews", { method: "POST", token, body: { reviewText: text.trim() } });
      toast("success", "Comment added");
      setText("");
      setShowAdd(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add comment");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    try {
      await api(`/business/me/reviews/${deleteRow._id}`, { method: "DELETE", token });
      toast("info", "Comment removed");
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not remove comment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Review Suggestions</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{rows.length} comment{rows.length !== 1 ? "s" : ""} shown to customers after they scan</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showAdd ? "rotate-45" : ""}`} strokeWidth={2} />
          {showAdd ? "Cancel" : "Add Comment"}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <label htmlFor="biz-new-comment" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Comment Text</label>
          <textarea
            id="biz-new-comment"
            value={text}
            onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
            placeholder="Great coffee and quick service!"
            rows={3}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
              error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            }`}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
              <AlertIcon className="w-3 h-3 shrink-0" />
              {error}
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
        renderActions={(row) => (
          <button
            onClick={() => setDeleteRow(row)}
            aria-label="Delete comment"
            title="Delete"
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            Delete
          </button>
        )}
      />

      <ConfirmDialog
        open={!!deleteRow}
        title="Delete this comment?"
        message="This review suggestion will no longer be shown to customers who scan your QR code."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </div>
  );
}
