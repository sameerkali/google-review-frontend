"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { BUSINESS_STATUS_OPTIONS, validate } from "../_lib/validators";
import { AlertIcon, CloseIcon } from "../_lib/icons";
import { generatePassword } from "../_lib/generatePassword";
import { useEscapeKey } from "../_lib/useEscapeKey";
import { Spinner } from "./Loaders";

const FIELDS: { f: string; label: string; required?: boolean }[] = [
  { f: "name", label: "Business Name", required: true },
  { f: "email", label: "Email Address", required: true },
  { f: "phone", label: "Phone Number" },
  { f: "address", label: "Address" },
  { f: "googleReviewUrl", label: "Google Review URL" },
];

function planId(business: Row | null): string {
  const p = business?.planId;
  return p && typeof p === "object" ? p._id : p || "";
}

export function BusinessEditModal({
  business, plans, token, onClose, onRefresh, toast,
}: {
  business: Row | null;
  plans: Row[];
  token: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: business?.address || "",
    googleReviewUrl: business?.googleReviewUrl || "",
  });
  const [status, setStatus] = useState(business?.status || "active");
  const [plan, setPlan] = useState(planId(business));
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  useEscapeKey(onClose, !!business && !saving);

  if (!business) return null;

  const save = async () => {
    const fieldNames = FIELDS.map((f) => f.f);
    const errs = validate(fieldNames, form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setServerError("");
    setSaving(true);
    try {
      await api(`/admin/business/${business._id}`, {
        method: "PUT",
        token,
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          googleReviewUrl: form.googleReviewUrl.trim() || undefined,
          status,
          planId: plan || null,
          password: newPassword.trim() || undefined,
        },
      });
      await onRefresh();
      toast("success", newPassword.trim() ? "Business updated — portal password changed" : "Business updated");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update business";
      if (/email/i.test(msg)) setErrors((prev) => ({ ...prev, email: "This email is already registered to another business" }));
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="biz-edit-title" className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 id="biz-edit-title" className="text-sm font-semibold text-white">Edit Business</h2>
          <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {serverError && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
              <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {FIELDS.map(({ f, label, required }) => (
            <div key={f} className="space-y-1.5">
              <label htmlFor={`biz-edit-${f}`} className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {label}{required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                id={`biz-edit-${f}`}
                type={f === "email" ? "email" : "text"}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                aria-invalid={!!errors[f]}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none transition-all duration-200 focus:ring-1 ${
                  errors[f] ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                }`}
              />
              {errors[f] && <p role="alert" className="text-xs text-red-400">{errors[f]}</p>}
            </div>
          ))}

          <div className="space-y-1.5">
            <label htmlFor="biz-edit-status" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</label>
            <select
              id="biz-edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            >
              {BUSINESS_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="biz-edit-plan" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Plan</label>
            <select
              id="biz-edit-plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            >
              <option value="">— none —</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="biz-edit-password" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Reset Portal Password
            </label>
            <div className="flex gap-2">
              <input
                id="biz-edit-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="flex-1 min-w-0 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15 font-mono"
              />
              <button
                type="button"
                onClick={() => setNewPassword(generatePassword())}
                className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
              >
                Generate
              </button>
            </div>
            {newPassword.trim() && (
              <p className="text-xs text-amber-400">New password: <span className="font-mono">{newPassword.trim()}</span> — copy it now, it won&apos;t be shown again after saving.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
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
