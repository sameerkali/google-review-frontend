"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { QrCard } from "@/components/QrCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

function slugifyCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return base || "BUSINESS";
}

function hardwareForBusiness(business: Row, hardwareList: Row[]): Row | undefined {
  return hardwareList.find((h) => {
    const assigned = h.assignedBusinessId;
    const id = assigned && typeof assigned === "object" ? assigned._id : assigned;
    return id === business._id;
  });
}

/* View (and manage) the QR code linked to a business at any time — not just
   at creation. Links a new one on the spot if none exists yet, and lets the
   admin unlink the current one to hand the hardware back to stock. */
export function QrViewModal({
  business, hardwareList, token, onClose, onRefresh, toast,
}: {
  business: Row | null;
  hardwareList: Row[];
  token: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [linking, setLinking] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  useEscapeKey(onClose, !!business && !confirmUnlink);

  if (!business) return null;

  const linked = hardwareForBusiness(business, hardwareList);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const suggestedCode = slugifyCode(business.name || "");
  const code = codeTouched ? codeInput : suggestedCode;

  const link = async () => {
    const trimmed = code.trim();
    if (!trimmed) { toast("error", "Enter a code first"); return; }
    setLinking(true);
    try {
      const existing = hardwareList.find((h) => h.serial === trimmed);
      if (existing) {
        await api(`/admin/assign`, { method: "POST", token, body: { serial: trimmed, businessId: business._id } });
      } else {
        await api(`/admin/hardware`, { method: "POST", token, body: { type: "QR", serial: trimmed, assignedBusinessId: business._id, status: "assigned" } });
      }
      await onRefresh();
      toast("success", `QR code "${trimmed}" is ready to scan`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not link that code");
    } finally {
      setLinking(false);
    }
  };

  const unlink = async () => {
    if (!linked) return;
    try {
      await api(`/admin/hardware/${linked._id}`, { method: "PUT", token, body: { assignedBusinessId: null, status: "available" } });
      await onRefresh();
      toast("info", `QR code "${linked.serial}" unlinked — the hardware is back in stock`);
      setConfirmUnlink(false);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not unlink that code");
    }
  };

  return (
    <>
      <Modal open={!!business} onClose={onClose} maxWidth="lg" labelledBy="qr-view-title">
        <div className="max-h-[85vh] flex flex-col">
          <ModalHeader onClose={onClose}>
            <h2 id="qr-view-title" className="text-sm font-semibold text-fg">{business.name}&apos;s QR Code</h2>
          </ModalHeader>

          <div className="px-6 py-5 overflow-y-auto">
            {linked ? (
              <div className="space-y-4">
                <QrCard
                  reviewUrl={`${baseUrl}/r/${encodeURIComponent(linked.serial)}`}
                  businessName={business.name}
                  toast={toast}
                  badgeLabel={linked.status === "assigned" ? "Active" : linked.status}
                  compact
                />
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
                  <p className="text-xs text-fg-tertiary">
                    Linked hardware: <span className="font-mono text-fg-secondary">{linked.serial}</span> ({linked.type})
                  </p>
                  <button
                    onClick={() => setConfirmUnlink(true)}
                    className="text-xs font-medium text-danger hover:text-danger-hover transition-colors cursor-pointer shrink-0 ml-3"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-fg-tertiary">
                  No QR code is linked to <span className="text-fg font-medium">{business.name}</span> yet.
                </p>
                <div>
                  <Label htmlFor="qr-link-code">Hardware Serial / Code</Label>
                  <Input
                    id="qr-link-code"
                    autoFocus
                    type="text"
                    value={code}
                    onChange={(e) => { setCodeInput(e.target.value); setCodeTouched(true); }}
                    placeholder="e.g. CAFE-DELHI"
                    className="font-mono"
                  />
                  <p className="mt-1.5 text-xs text-fg-quaternary">
                    {codeTouched ? "Doesn't need to exist yet — it's created automatically." : "Suggested from the business name — edit if you already have a physical code."}
                  </p>
                </div>
                <Button onClick={link} loading={linking} loadingText="Linking…" variant="primary">
                  Link &amp; Generate QR
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmUnlink}
        title="Unlink this QR code?"
        message={`"${linked?.serial}" will stop resolving for ${business.name} and go back to available stock. You can re-link it or a new code anytime.`}
        confirmLabel="Unlink"
        onConfirm={unlink}
        onCancel={() => setConfirmUnlink(false)}
      />
    </>
  );
}
