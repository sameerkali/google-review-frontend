"use client";

import { useState } from "react";
import { AlertIcon } from "../_lib/icons";
import { Spinner } from "./Loaders";

/* Shared confirmation modal for destructive actions (delete business, delete
   hardware, unlink a QR). Renders nothing when closed. */
export function ConfirmDialog({
  open, title, message, confirmLabel = "Delete", onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === "Escape" && !busy) onCancel(); }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertIcon className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 id="confirm-title" className="text-sm font-semibold text-white">{title}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {busy ? <><Spinner /> Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
