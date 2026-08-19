"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { CloseIcon } from "../_lib/icons";
import { useEscapeKey } from "../_lib/useEscapeKey";
import { Spinner } from "./Loaders";
import { QrCard } from "./QrCard";
import { ConfirmDialog } from "./ConfirmDialog";

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
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="qr-view-title" className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 id="qr-view-title" className="text-sm font-semibold text-white">{business.name}&apos;s QR Code</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

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
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  Linked hardware: <span className="font-mono text-zinc-300">{linked.serial}</span> ({linked.type})
                </p>
                <button
                  onClick={() => setConfirmUnlink(true)}
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0 ml-3"
                >
                  Unlink
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                No QR code is linked to <span className="text-white font-medium">{business.name}</span> yet.
              </p>
              <div className="space-y-1.5">
                <label htmlFor="qr-link-code" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Hardware Serial / Code
                </label>
                <input
                  id="qr-link-code"
                  autoFocus
                  type="text"
                  value={code}
                  onChange={(e) => { setCodeInput(e.target.value); setCodeTouched(true); }}
                  placeholder="e.g. CAFE-DELHI"
                  className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15 font-mono"
                />
                <p className="text-xs text-zinc-600">
                  {codeTouched ? "Doesn't need to exist yet — it's created automatically." : "Suggested from the business name — edit if you already have a physical code."}
                </p>
              </div>
              <button
                onClick={link}
                disabled={linking}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {linking ? <><Spinner /> Linking…</> : "Link & Generate QR"}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmUnlink}
        title="Unlink this QR code?"
        message={`"${linked?.serial}" will stop resolving for ${business.name} and go back to available stock. You can re-link it or a new code anytime.`}
        confirmLabel="Unlink"
        onConfirm={unlink}
        onCancel={() => setConfirmUnlink(false)}
      />
    </div>
  );
}
