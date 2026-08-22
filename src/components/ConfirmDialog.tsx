"use client";

import { useState } from "react";
import { AlertIcon } from "@/components/icons";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
  useEscapeKey(onCancel, open && !busy);
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
    <Modal open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" role="alertdialog" labelledBy="confirm-title">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-danger/15 flex items-center justify-center shrink-0">
            <AlertIcon className="w-4.5 h-4.5 text-danger" />
          </div>
          <div className="space-y-1">
            <h2 id="confirm-title" className="text-sm font-semibold text-fg">{title}</h2>
            <p className="text-xs text-fg-tertiary leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} loading={busy} loadingText="Working…">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
