"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "../_lib/context";
import type { Row } from "@/lib/types";
import { api } from "@/lib/api";
import { MenuItemManager } from "@/components/MenuItemManager";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function BusinessMenuPage() {
  const { token, authChecked, toast } = useBusiness();
  const enabled = authChecked && !!token;
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addErr, setAddErr] = useState("");
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const queryKey = ["business", "me", "menu-items"];
  const { data: rows = [], isPending: loading } = useQuery({
    queryKey,
    queryFn: () => api<Row[]>("/business/me/menu-items", { token }),
    enabled,
  });

  const addMutation = useMutation({
    mutationKey: ["business", "menu-items", "add"],
    mutationFn: (body: { name: string; price?: number }) => api("/business/me/menu-items", { method: "POST", token, body }),
    meta: { toastOnError: false }, // inline `addErr` state below
    onSuccess: () => {
      toast("success", "Item added");
      setNewName("");
      setNewPrice("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e) => setAddErr(e instanceof Error ? e.message : "Could not add item"),
  });

  const deleteMutation = useMutation({
    mutationKey: ["business", "menu-items", "delete"],
    mutationFn: (id: string) => api(`/business/me/menu-items/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      toast("info", `"${deleteRow?.name}" removed`);
      setDeleteRow(null);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Both mutations below update the cache immediately in onMutate (so the
  // toggle/drag feels instant, no waiting on the round trip) and only touch
  // the network after the UI already reflects the change. onError rolls
  // back to the exact snapshot taken before the optimistic write, rather
  // than an invalidate-and-refetch, so a failed request visibly un-does
  // itself instead of just eventually resyncing.
  const toggleActiveMutation = useMutation({
    mutationKey: ["business", "menu-items", "toggle-active"],
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api(`/business/me/menu-items/${id}`, { method: "PATCH", token, body: { active } }),
    meta: { toastOnError: false }, // onError below shows its own, more specific message
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Row[]>(queryKey);
      queryClient.setQueryData<Row[]>(queryKey, (old) => old?.map((r) => (String(r._id) === id ? { ...r, active } : r)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast("error", "Could not update that item - try again");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderMutation = useMutation({
    mutationKey: ["business", "menu-items", "reorder"],
    mutationFn: (orderedIds: string[]) => api("/business/me/menu-items/reorder", { method: "PATCH", token, body: { orderedIds } }),
    meta: { toastOnError: false }, // onError below shows its own, more specific message
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Row[]>(queryKey);
      const byId = new Map((previous || []).map((r) => [String(r._id), r]));
      queryClient.setQueryData<Row[]>(queryKey, () => orderedIds.map((id) => byId.get(id)).filter((r): r is Row => !!r));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast("error", "Could not save the new order - try again");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const onReorder = (orderedIds: string[]) => reorderMutation.mutate(orderedIds);

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
        <div>
          <h2 className="text-lg font-semibold text-fg">Menu</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">
            {loading ? "Loading…" : `${rows.length} item${rows.length !== 1 ? "s" : ""}`} - the top of this list is what
            customers see first on the review page.
          </p>
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

      <MenuItemManager
        items={rows.map((r) => ({ _id: String(r._id), name: r.name, price: r.price, category: r.category, active: r.active }))}
        loading={loading}
        onReorder={onReorder}
        onToggleActive={(row, active) => toggleActiveMutation.mutate({ id: row._id, active })}
        onDelete={(row) => setDeleteRow(row)}
        emptyMessage="No menu items yet - add your first one above."
      />
      <p className="text-xs text-fg-quaternary">
        The switch controls whether an item is offered to customers at all. Drag a row by its handle to reorder -
        the first few items become the default suggestions on the review page.
      </p>

      <ConfirmDialog
        open={!!deleteRow}
        title="Remove this item?"
        message={`"${deleteRow?.name}" will no longer show up as a menu chip on your review page.`}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </div>
  );
}
