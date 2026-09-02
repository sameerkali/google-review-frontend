"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "../_lib/context";
import type { Row, ToastFn } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { BulkMenuUploadModal } from "../_components/BulkMenuUploadModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AlertIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/Loaders";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

// ── Business list ────────────────────────────────────────────────────────────

interface BizSummary {
  _id: string;
  name: string;
  email: string;
  status: string;
  total: number;
  active: number;
}

function BusinessList({
  token, authChecked, onSelect, onBulkOpen,
}: {
  token: string;
  authChecked: boolean;
  onSelect: (b: BizSummary) => void;
  onBulkOpen: () => void;
}) {
  const { data: rows = [], isPending: loading } = useQuery({
    queryKey: ["admin", "menu-items", "businesses"],
    queryFn: () => api<BizSummary[]>("/admin/menu-items/businesses", { token }),
    enabled: authChecked && !!token,
  });

  const badge = (n: number, color: string) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{n}</span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">Menu Management</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">
            {loading ? "Loading…" : `${rows.length} business${rows.length !== 1 ? "es" : ""} with a menu`}
          </p>
        </div>
        <Button variant="secondary" onClick={onBulkOpen} className="self-start sm:self-auto">
          <UploadIcon className="w-4 h-4" />
          Upload JSON
        </Button>
      </div>

      {loading ? (
        <>
          <div className="space-y-3 sm:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block rounded-2xl border border-border overflow-hidden">
            <div className="bg-surface px-4 py-3 border-b border-border flex gap-6">
              {["Business", "Email", "Active", "Total"].map((h) => <Skeleton key={h} className="h-3 w-16" />)}
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-border flex gap-6">
                {[...Array(4)].map((_, c) => <Skeleton key={c} className="h-3 w-16" />)}
              </div>
            ))}
          </div>
        </>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-sm text-fg-tertiary">No menu items yet</p>
          <p className="text-xs text-fg-quaternary mt-1">Upload a JSON file to get started</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {rows.map((b) => (
              <button
                key={b._id}
                onClick={() => onSelect(b)}
                className="w-full text-left rounded-2xl border border-border bg-surface p-4 space-y-2.5 hover:border-border-strong transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-fg">{b.name}</span>
                  <span className="text-xs text-fg-tertiary">{b.total} total</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badge(b.active, "bg-success/15 text-success")}
                  <span className="text-xs text-fg-quaternary">active</span>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden sm:block rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  {["Business", "Email", "Active", "Total"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-fg-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b._id} onClick={() => onSelect(b)} className="border-b border-border hover:bg-surface/70 transition-colors duration-100 cursor-pointer">
                    <td className="px-4 py-3 text-fg-secondary font-medium whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-3 text-fg-tertiary whitespace-nowrap">{b.email}</td>
                    <td className="px-4 py-3">{badge(b.active, "bg-success/15 text-success")}</td>
                    <td className="px-4 py-3 text-fg-secondary font-semibold">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Menu item list for one business ──────────────────────────────────────────

function ItemList({
  biz, token, authChecked, toast, onBack,
}: {
  biz: BizSummary;
  token: string;
  authChecked: boolean;
  toast: ToastFn;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addErr, setAddErr] = useState("");
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const queryKey = ["admin", "menu-items", "list", biz._id];
  const { data: rows = [], isPending: loading } = useQuery({
    queryKey,
    queryFn: () => api<Row[]>(`/admin/menu-items?businessId=${biz._id}`, { token }),
    enabled: authChecked && !!token,
  });

  const addMutation = useMutation({
    mutationKey: ["admin", "menu-items", "add"],
    mutationFn: (body: { name: string; price?: number }) => api("/admin/menu-items", { method: "POST", token, body: { businessId: biz._id, ...body } }),
    meta: { toastOnError: false }, // inline `addErr` state below
    onSuccess: () => {
      toast("success", "Item added");
      setNewName("");
      setNewPrice("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "businesses"] });
    },
    onError: (e) => setAddErr(e instanceof Error ? e.message : "Could not add item"),
  });

  const deleteMutation = useMutation({
    mutationKey: ["admin", "menu-items", "delete"],
    mutationFn: (id: string) => api(`/admin/menu-items/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      toast("info", `"${deleteRow?.name}" removed`);
      setDeleteRow(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "businesses"] });
    },
  });

  const addItem = () => {
    if (!newName.trim()) { setAddErr("Item name is required"); return; }
    if (newPrice.trim() && isNaN(Number(newPrice))) { setAddErr("Price must be a number"); return; }
    setAddErr("");
    addMutation.mutate({ name: newName.trim(), price: newPrice.trim() ? Number(newPrice) : undefined });
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    await deleteMutation.mutateAsync(String(deleteRow._id)).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>← Back</Button>
          <div>
            <h2 className="text-lg font-semibold text-fg">{biz.name}</h2>
            <p className="text-sm text-fg-tertiary mt-0.5">{rows.length} item{rows.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowAdd((v) => !v)}>
          <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showAdd ? "rotate-45" : ""}`} />
          {showAdd ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
            <div>
              <Label htmlFor="new-menu-item">Item Name</Label>
              <Input
                id="new-menu-item"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); if (addErr) setAddErr(""); }}
                placeholder="Cold Brew"
                error={!!addErr}
              />
            </div>
            <div>
              <Label htmlFor="new-menu-item-price">Price (optional)</Label>
              <Input
                id="new-menu-item-price"
                type="number"
                inputMode="decimal"
                min={0}
                value={newPrice}
                onChange={(e) => { setNewPrice(e.target.value); if (addErr) setAddErr(""); }}
                placeholder="150"
              />
            </div>
          </div>
          {addErr && (
            <p role="alert" className="flex items-center gap-1 text-xs text-danger">
              <AlertIcon className="w-3 h-3 shrink-0" />
              {addErr}
            </p>
          )}
          <Button variant="primary" onClick={addItem} loading={addMutation.isPending} loadingText="Saving…">
            Save Item
          </Button>
        </div>
      )}

      <DataTable
        rows={rows}
        cols={["name", "price", "category", "active", "createdAt"]}
        loading={loading}
        toast={toast}
        renderActions={(row) => (
          <IconButton onClick={() => setDeleteRow(row)} aria-label={`Delete ${row.name}`} title="Delete" tone="danger">
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        )}
      />

      <ConfirmDialog
        open={!!deleteRow}
        title="Remove this item?"
        message={`"${deleteRow?.name}" will no longer show up as a menu chip on this business's review page.`}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </div>
  );
}

// ── Root page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const { token, authChecked, toast } = useAdmin();
  const { data: businesses = [] } = useQuery({
    queryKey: ["admin", "businesses", "all"],
    queryFn: () => api<Row[]>("/admin/business", { token }),
    enabled: authChecked && !!token,
  });
  const [selected, setSelected] = useState<BizSummary | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <>
      {selected ? (
        <ItemList biz={selected} token={token} authChecked={authChecked} toast={toast} onBack={() => setSelected(null)} />
      ) : (
        <BusinessList token={token} authChecked={authChecked} onSelect={setSelected} onBulkOpen={() => setBulkOpen(true)} />
      )}
      <BulkMenuUploadModal open={bulkOpen} businesses={businesses} token={token} onClose={() => setBulkOpen(false)} toast={toast} />
    </>
  );
}
