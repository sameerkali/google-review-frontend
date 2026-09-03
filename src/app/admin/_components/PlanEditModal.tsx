"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Label } from "@/components/ui/Input";

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

/* Add/edit a plan tier - Basic/Starter/Pro, or any custom tier - with its three
   named feature flags. Structure only for now: nothing yet reads these flags
   to gate what a business owner actually sees. */
export function PlanEditModal({
  open, plan, token, onClose, toast,
}: {
  open: boolean;
  /** null when adding a new plan, a Row when editing an existing one. */
  plan: Row | null;
  token: string;
  onClose: () => void;
  toast: ToastFn;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanForm>(() => toForm(plan));
  const [nameErr, setNameErr] = useState("");
  const [priceErr, setPriceErr] = useState("");

  const saveMutation = useMutation({
    mutationKey: ["admin", "plans", "save"],
    mutationFn: (body: Record<string, unknown>) => api(plan ? `/admin/plans/${plan._id}` : "/admin/plans", { method: plan ? "PUT" : "POST", token, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      if (plan) {
        // Editing an existing plan can change its name/price, which is
        // embedded (populated) in every business row that's on this plan.
        queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "list"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "all"] });
      }
      toast("success", plan ? "Plan updated" : "Plan created");
      onClose();
    },
  });
  useEscapeKey(onClose, open && !saveMutation.isPending);

  if (!open) return null;

  const save = () => {
    const nErr = !form.name.trim() ? "Plan name is required" : "";
    const pErr = !form.price.trim() || isNaN(Number(form.price)) ? "Enter a valid price" : "";
    setNameErr(nErr);
    setPriceErr(pErr);
    if (nErr || pErr) return;

    saveMutation.mutate({
      name: form.name.trim(),
      billingType: form.billingType,
      price: Number(form.price),
      features: { analytics: form.analytics, userData: form.userData, suggestions: form.suggestions },
    });
  };

  return (
    <Modal open={open} onClose={saveMutation.isPending ? undefined : onClose} maxWidth="md" labelledBy="plan-edit-title">
      <div className="max-h-[85vh] flex flex-col">
        <ModalHeader onClose={saveMutation.isPending ? undefined : onClose}>
          <h2 id="plan-edit-title" className="text-sm font-semibold text-fg">{plan ? "Edit Plan" : "New Plan"}</h2>
        </ModalHeader>

        <div className="overflow-y-auto">
          <ModalBody>
            <Field label="Name *" htmlFor="plan-name" error={nameErr}>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); if (nameErr) setNameErr(""); }}
                placeholder="Basic / Starter / Pro"
                error={!!nameErr}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-billing">Billing</Label>
                <Select id="plan-billing" value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value as PlanForm["billingType"] })}>
                  {BILLING_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
              <Field label="Price *" htmlFor="plan-price" error={priceErr}>
                <Input
                  id="plan-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => { setForm({ ...form, price: e.target.value }); if (priceErr) setPriceErr(""); }}
                  error={!!priceErr}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Features</p>
              <div>
                <label htmlFor="plan-analytics" className="block text-xs text-fg-tertiary mb-1.5">Analytics visible to the business</label>
                <Select id="plan-analytics" value={form.analytics} onChange={(e) => setForm({ ...form, analytics: e.target.value as PlanForm["analytics"] })}>
                  {ANALYTICS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-fg-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.userData}
                  onChange={(e) => setForm({ ...form, userData: e.target.checked })}
                  className="w-4 h-4 rounded border-border-strong bg-surface-inset accent-brand cursor-pointer"
                />
                Scanner device/browser data
              </label>
              <label className="flex items-center gap-2.5 text-sm text-fg-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.suggestions}
                  onChange={(e) => setForm({ ...form, suggestions: e.target.checked })}
                  className="w-4 h-4 rounded border-border-strong bg-surface-inset accent-brand cursor-pointer"
                />
                Foot-traffic growth suggestions
              </label>
            </div>
          </ModalBody>
        </div>

        <ModalFooter>
          <Button onClick={save} loading={saveMutation.isPending} loadingText="Saving…" variant="primary" className="ml-auto">
            Save Plan
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
