"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { MenuJsonInput } from "@/components/MenuJsonInput";
import { parseMenuJson, type ParsedMenuItem } from "@/lib/parseMenuJson";

/* Bulk-imports menu items from a JSON file or pasted JSON, instead of adding
   one at a time through the inline form. */
export function BulkMenuUploadModal({
  open, businesses, token, onClose, toast,
}: {
  open: boolean;
  businesses: Row[];
  token: string;
  onClose: () => void;
  toast: ToastFn;
}) {
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const uploadMutation = useMutation({
    mutationKey: ["admin", "menu-items", "bulk-upload"],
    mutationFn: (items: (ParsedMenuItem & { businessId: string })[]) =>
      api<{ created: number; skipped: number }>("/admin/menu-items/bulk", { method: "POST", token, body: { items } }),
    meta: { toastOnError: false }, // inline `error` state below
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "businesses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "list"] });
      if (res.skipped) {
        toast("info", `Uploaded ${res.created} item${res.created !== 1 ? "s" : ""} - ${res.skipped} row${res.skipped !== 1 ? "s" : ""} skipped`);
      } else {
        toast("success", `Uploaded ${res.created} item${res.created !== 1 ? "s" : ""}`);
      }
      setText("");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Upload failed"),
  });
  useEscapeKey(onClose, open && !uploadMutation.isPending);

  if (!open) return null;

  const upload = () => {
    if (!businessId) {
      setError("Select which business this menu belongs to first");
      return;
    }
    const result = parseMenuJson(text);
    if (!result.items) {
      setError(result.error);
      return;
    }

    setError("");
    uploadMutation.mutate(result.items.map((it) => ({ ...it, businessId })));
  };

  return (
    <Modal open={open} onClose={uploadMutation.isPending ? undefined : onClose} maxWidth="2xl" labelledBy="bulk-menu-title">
      <div className="max-h-[85vh] flex flex-col">
        <ModalHeader onClose={uploadMutation.isPending ? undefined : onClose}>
          <h2 id="bulk-menu-title" className="text-sm font-semibold text-fg">Bulk Upload Menu Items</h2>
        </ModalHeader>

        <div className="overflow-y-auto">
          <ModalBody>
            <p className="text-xs text-fg-tertiary leading-relaxed">
              Pick the business below, then upload or paste each item&apos;s name and price - no
              business ID needed, it&apos;s attached automatically, and any <code>id</code> field is
              ignored. Price is optional; plain name strings still work too. You can still add items
              one at a time from the form on this page, and you can run this upload as many times as
              you like.
            </p>

            <Field label="Business *" htmlFor="bulk-menu-business" error={error && !businessId ? error : undefined}>
              <Select
                id="bulk-menu-business"
                value={businessId}
                onChange={(e) => { setBusinessId(e.target.value); if (error) setError(""); }}
                error={!!(error && !businessId)}
              >
                <option value="">Select a business…</option>
                {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </Select>
              {!businesses.length && (
                <p className="mt-1.5 text-xs text-fg-tertiary">No businesses yet - onboard one first from the Overview tab.</p>
              )}
            </Field>

            <MenuJsonInput
              id="bulk-menu-json"
              value={text}
              onChange={(v) => { setText(v); if (error) setError(""); }}
              error={error && businessId ? error : undefined}
            />
          </ModalBody>
        </div>

        <ModalFooter>
          <Button onClick={upload} disabled={!text.trim() || !businessId} loading={uploadMutation.isPending} loadingText="Uploading…" variant="primary" className="ml-auto">
            Upload
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
