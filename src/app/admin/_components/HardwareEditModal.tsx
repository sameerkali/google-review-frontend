"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { HARDWARE_STATUS_OPTIONS } from "../_lib/validators";
import { CloseIcon } from "../_lib/icons";
import { Spinner } from "./Loaders";

/* Full edit for a hardware/QR record: rename its serial, change type/status,
   or reassign it to a different business — the "U" in CRUD for hardware. */
export function HardwareEditModal({
  hardware, businesses, token, onClose, onRefresh, toast,
}: {
  hardware: Row | null;
  businesses: Row[];
  token: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const linkedId = hardware?.assignedBusinessId
    ? (typeof hardware.assignedBusinessId === "object" ? hardware.assignedBusinessId._id : hardware.assignedBusinessId)
    : "";

  const [type, setType] = useState(hardware?.type || "QR");
  const [serial, setSerial] = useState(hardware?.serial || "");
  const [status, setStatus] = useState(hardware?.status || "available");
  const [businessId, setBusinessId] = useState(linkedId || "");
  const [serialErr, setSerialErr] = useState("");
  const [saving, setSaving] = useState(false);

  if (!hardware) return null;

  const save = async () => {
    if (!serial.trim()) { setSerialErr("Serial is required"); return; }
    setSerialErr("");
    setSaving(true);
    try {
      await api(`/admin/hardware/${hardware._id}`, {
        method: "PUT",
        token,
        body: {
          type,
          serial: serial.trim(),
          status,
          assignedBusinessId: status === "assigned" ? (businessId || null) : null,
        },
      });
      await onRefresh();
      toast("success", "Hardware updated");
      onClose();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not update hardware");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === "Escape" && !saving) onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="hw-edit-title" className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 id="hw-edit-title" className="text-sm font-semibold text-white">Edit Hardware</h2>
          <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="hw-type" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</label>
              <select
                id="hw-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              >
                <option value="QR">QR</option>
                <option value="NFC">NFC</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hw-status" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</label>
              <select
                id="hw-status"
                value={status}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatus(v);
                  if (v !== "assigned") setBusinessId("");
                }}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              >
                {HARDWARE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="hw-serial" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Serial Number</label>
            <input
              id="hw-serial"
              value={serial}
              onChange={(e) => { setSerial(e.target.value); if (serialErr) setSerialErr(""); }}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none font-mono transition-all duration-200 focus:ring-1 ${
                serialErr ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              }`}
            />
            {serialErr && <p role="alert" className="text-xs text-red-400">{serialErr}</p>}
          </div>

          {status === "assigned" && (
            <div className="space-y-1.5">
              <label htmlFor="hw-business" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Assigned Business</label>
              <select
                id="hw-business"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              >
                <option value="">— none —</option>
                {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={save}
            disabled={saving}
            className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? <><Spinner /> Saving…</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
