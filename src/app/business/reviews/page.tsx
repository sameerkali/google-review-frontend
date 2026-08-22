"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBusiness } from "../_lib/context";
import type { Row } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";

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
          <h2 className="text-lg font-semibold text-fg">Review Suggestions</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">{rows.length} comment{rows.length !== 1 ? "s" : ""} shown to customers after they scan</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd((v) => !v)} className="self-start sm:self-auto">
          <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showAdd ? "rotate-45" : ""}`} />
          {showAdd ? "Cancel" : "Add Comment"}
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3 animate-scale-in">
          <Label htmlFor="biz-new-comment">Comment Text</Label>
          <Textarea
            id="biz-new-comment"
            value={text}
            onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
            placeholder="Great coffee and quick service!"
            rows={3}
            error={!!error}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1 text-xs text-danger">
              <AlertIcon className="w-3 h-3 shrink-0" />
              {error}
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
        renderActions={(row) => (
          <button
            onClick={() => setDeleteRow(row)}
            aria-label="Delete comment"
            title="Delete"
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-fg-tertiary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
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
