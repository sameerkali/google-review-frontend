"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { CloseIcon } from "../_lib/icons";
import { useEscapeKey } from "../_lib/useEscapeKey";
import { Spinner } from "./Loaders";

const BILLING_OPTIONS = ["monthly", "annually", "one_time"] as const;
const ANALYTICS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "basic", label: "Basic" },
  { value: "full", label: "Full" },
] as const;

export interface PlanForm {
  name: string;
  billingType: typeof BILLING_OPTIONS[number];
  price: string;
  analytics: typeof ANALYTICS_OPTIONS[number]["value"];
  userData: boolean;
  suggestions: boolean;
}

const emptyForm: PlanForm = { name: "", billingType: "monthly", price: "", analytics: "none", userData: false, suggestions: false };

function toForm(plan: Row | null): PlanForm {
  if (!plan) return emptyForm;
  const f = (plan.features as Row) || {};
  return {
    name: plan.name || "",
    billingType: (plan.billingType as PlanForm["billingType"]) || "monthly",
    price: String(plan.price ?? ""),
    analytics: (f.analytics as PlanForm["analytics"]) || "none",
    userData: Boolean(f.userData),
    suggestions: Boolean(f.suggestions),
  };
}

/* Add/edit a plan tier — Basic/Starter/Pro, or any custom tier — with its three
   named feature flags. Structure only for now: nothing yet reads these flags
   to gate what a business owner actually sees. */
export function PlanEditModal({
  open, plan, token, onClose, onRefresh, toast,
}: {
  open: boolean;
  /** null when adding a new plan, a Row when editing an existing one. */
  plan: Row | null;
  token: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const [form, setForm] = useState<PlanForm>(() => toForm(plan));
  const [nameErr, setNameErr] = useState("");
  const [priceErr, setPriceErr] = useState("");
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose, open && !saving);

  if (!open) return null;

  const save = async () => {
    const nErr = !form.name.trim() ? "Plan name is required" : "";
    const pErr = !form.price.trim() || isNaN(Number(form.price)) ? "Enter a valid price" : "";
    setNameErr(nErr);
    setPriceErr(pErr);
    if (nErr || pErr) return;

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        billingType: form.billingType,
        price: Number(form.price),
        features: { analytics: form.analytics, userData: form.userData, suggestions: form.suggestions },
      };
      await api(plan ? `/admin/plans/${plan._id}` : "/admin/plans", { method: plan ? "PUT" : "POST", token, body });
      await onRefresh();
      toast("success", plan ? "Plan updated" : "Plan created");
      onClose();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not save plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="plan-edit-title" className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 id="plan-edit-title" className="text-sm font-semibold text-white">{plan ? "Edit Plan" : "New Plan"}</h2>
          <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label htmlFor="plan-name" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Name <span className="text-red-400">*</span></label>
            <input
              id="plan-name"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); if (nameErr) setNameErr(""); }}
              placeholder="Basic / Starter / Pro"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none focus:ring-1 ${
                nameErr ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              }`}
            />
            {nameErr && <p role="alert" className="text-xs text-red-400">{nameErr}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="plan-billing" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Billing</label>
              <select
                id="plan-billing"
                value={form.billingType}
                onChange={(e) => setForm({ ...form, billingType: e.target.value as PlanForm["billingType"] })}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              >
                {BILLING_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-price" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Price <span className="text-red-400">*</span></label>
              <input
                id="plan-price"
                type="number"
                value={form.price}
                onChange={(e) => { setForm({ ...form, price: e.target.value }); if (priceErr) setPriceErr(""); }}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 ${
                  priceErr ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                }`}
              />
              {priceErr && <p role="alert" className="text-xs text-red-400">{priceErr}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 p-4 space-y-4">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Features</p>
            <div className="space-y-1.5">
              <label htmlFor="plan-analytics" className="text-xs text-zinc-400">Analytics visible to the business</label>
              <select
                id="plan-analytics"
                value={form.analytics}
                onChange={(e) => setForm({ ...form, analytics: e.target.value as PlanForm["analytics"] })}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              >
                {ANALYTICS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.userData}
                onChange={(e) => setForm({ ...form, userData: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-500 cursor-pointer"
              />
              Scanner device/browser data
            </label>
            <label className="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.suggestions}
                onChange={(e) => setForm({ ...form, suggestions: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-emerald-500 cursor-pointer"
              />
              Foot-traffic growth suggestions
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? <><Spinner /> Saving…</> : "Save Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
