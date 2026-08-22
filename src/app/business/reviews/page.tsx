"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useBusiness } from "../_lib/context";
import type { Row } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";

export default function BusinessReviewsPage() {
  const { token, authChecked, toast } = useBusiness();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const { data: rows = [], isPending: loading } = useQuery({
    queryKey: ["business", "me", "reviews"],
    queryFn: () => api<Row[]>("/business/me/reviews", { token }),
    enabled: authChecked && !!token,
  });

  const addMutation = useMutation({
    mutationKey: ["business", "me", "reviews", "add"],
    mutationFn: (reviewText: string) => api("/business/me/reviews", { method: "POST", token, body: { reviewText } }),
    meta: { toastOnError: false }, // inline `error` state below instead
    onSuccess: () => {
      toast("success", "Comment added");
      setText("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["business", "me", "reviews"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add comment"),
  });

  const deleteMutation = useMutation({
    mutationKey: ["business", "me", "reviews", "delete"],
    mutationFn: (id: string) => api(`/business/me/reviews/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      toast("info", "Comment removed");
      setDeleteRow(null);
      queryClient.invalidateQueries({ queryKey: ["business", "me", "reviews"] });
    },
  });

  const addComment = () => {
    if (!text.trim()) { setError("Comment text is required"); return; }
    setError("");
    addMutation.mutate(text.trim());
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    // Errors are surfaced via the global mutation-error toast; swallow here
    // only so ConfirmDialog's busy state resolves cleanly either way.
    await deleteMutation.mutateAsync(String(deleteRow._id)).catch(() => {});
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
          <Button variant="primary" onClick={addComment} loading={addMutation.isPending} loadingText="Saving…">
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
