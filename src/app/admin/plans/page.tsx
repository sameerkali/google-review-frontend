"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "@/lib/types";
import { PlanEditModal } from "../_components/PlanEditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/Loaders";
import { CheckIcon, CloseIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/Button";

const BILLING_LABEL: Record<string, string> = { monthly: "/mo", annually: "/yr", one_time: " one-time" };

function FeatureRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {on ? <CheckIcon className="w-4 h-4 text-success shrink-0" /> : <CloseIcon className="w-4 h-4 text-fg-quaternary shrink-0" />}
      <span className={on ? "text-fg-secondary" : "text-fg-quaternary"}>{label}</span>
    </div>
  );
}

export default function PlansPage() {
  const { data, dataLoading, token, toast, refresh } = useAdmin();
  const plans = (data.p as Row[]) || [];

  const [editPlan, setEditPlan] = useState<Row | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [deletePlan, setDeletePlan] = useState<Row | null>(null);

  // Remount the modal fresh each time it opens, so its internal form state
  // never leaks between "Add" and editing a different plan.
  const openAdd = () => { setEditPlan(null); setModalKey((k) => k + 1); setModalOpen(true); };
  const openEdit = (p: Row) => { setEditPlan(p); setModalKey((k) => k + 1); setModalOpen(true); };

  const confirmDelete = async () => {
    if (!deletePlan) return;
    try {
      await api(`/admin/plans/${deletePlan._id}`, { method: "DELETE", token });
      await refresh();
      toast("info", `"${deletePlan.name}" deleted`);
      setDeletePlan(null);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not delete plan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">Plan Management</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""} · billing tiers for recurring revenue</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover px-4 py-2 text-sm font-semibold text-white transition-all duration-150 cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          Add Plan
        </button>
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : !plans.length ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-sm text-fg-tertiary">No plans yet</p>
          <p className="text-xs text-fg-quaternary mt-1">Add a Basic / Starter / Pro tier to start assigning businesses to a plan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => {
            const f = (p.features as Row) || {};
            return (
              <div key={p._id} className="rounded-2xl border border-border bg-surface p-6 space-y-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-fg">{p.name}</h3>
                    <p className="text-2xl font-bold text-fg font-mono tabular-nums mt-1">
                      ₹{p.price}<span className="text-sm font-normal text-fg-tertiary">{BILLING_LABEL[String(p.billingType)] || ""}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} title="Edit">
                      <PencilIcon className="w-4 h-4" />
                    </IconButton>
                    <IconButton onClick={() => setDeletePlan(p)} aria-label={`Delete ${p.name}`} title="Delete" tone="danger">
                      <TrashIcon className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <FeatureRow label="QR code + basic functionality" on />
                  <FeatureRow label={`Analytics: ${f.analytics === "full" ? "Full" : f.analytics === "basic" ? "Basic" : "None"}`} on={f.analytics !== "none"} />
                  <FeatureRow label="Scanner device/browser data" on={Boolean(f.userData)} />
                  <FeatureRow label="Foot-traffic growth suggestions" on={Boolean(f.suggestions)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PlanEditModal
        key={modalKey}
        open={modalOpen}
        plan={editPlan}
        token={token}
        onClose={() => setModalOpen(false)}
        onRefresh={refresh}
        toast={toast}
      />

      <ConfirmDialog
        open={!!deletePlan}
        title="Delete this plan?"
        message={`"${deletePlan?.name}" will be permanently removed. Any business on this plan will be unassigned, not deleted.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletePlan(null)}
      />
    </div>
  );
}
