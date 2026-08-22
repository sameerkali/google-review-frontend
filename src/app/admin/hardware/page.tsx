"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "@/lib/types";
import { usePaginatedList } from "../_lib/usePaginatedList";
import { ListTab } from "@/components/ListTab";
import { HardwareEditModal } from "../_components/HardwareEditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/Button";

export default function HardwarePage() {
  const { data, token, toast, create, refresh } = useAdmin();
  const businesses = (data.b as Row[]) || [];
  const list = usePaginatedList("/admin/hardware", token, toast);

  // Populated assignedBusinessId (an object) → flatten to a plain "business" column
  // the shared DataTable can render, instead of showing raw ids or [object Object].
  const rows = list.rows.map((h) => ({
    ...h,
    business: h.assignedBusinessId && typeof h.assignedBusinessId === "object" ? h.assignedBusinessId.name : "—",
  }));

  const [editHardware, setEditHardware] = useState<Row | null>(null);
  const [deleteHardware, setDeleteHardware] = useState<Row | null>(null);

  // Both the bootstrapped admin data (used for dropdowns elsewhere) and this
  // page's own paginated slice need to reflect any change made here.
  const refreshAll = async () => { await Promise.all([refresh(), list.reload()]); };

  const confirmDelete = async () => {
    if (!deleteHardware) return;
    try {
      await api(`/admin/hardware/${deleteHardware._id}`, { method: "DELETE", token });
      await refreshAll();
      toast("info", `Hardware "${deleteHardware.serial}" deleted`);
      setDeleteHardware(null);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not delete hardware");
    }
  };

  return (
    <>
      <ListTab
        title="Hardware Management"
        rows={rows}
        cols={["type", "serial", "business", "status"]}
        onAdd={async (body) => {
          const created = await create("hardware", { items: [body] });
          if (created) await list.reload();
          return Boolean(created);
        }}
        addFields={["type", "serial"]}
        loading={list.loading}
        toast={toast}
        pagination={{
          search: list.search,
          onSearchChange: list.changeSearch,
          page: list.page,
          totalPages: list.totalPages,
          total: list.total,
          onPageChange: list.setPage,
          limit: list.limit,
          onLimitChange: list.changeLimit,
        }}
        renderActions={(row) => (
          <>
            <IconButton onClick={() => setEditHardware(row)} aria-label={`Edit ${row.serial}`} title="Edit">
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton onClick={() => setDeleteHardware(row)} aria-label={`Delete ${row.serial}`} title="Delete" tone="danger">
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </>
        )}
      />

      {editHardware && (
        <HardwareEditModal
          key={editHardware._id}
          hardware={editHardware}
          businesses={businesses}
          token={token}
          onClose={() => setEditHardware(null)}
          onRefresh={refreshAll}
          toast={toast}
        />
      )}

      <ConfirmDialog
        open={!!deleteHardware}
        title="Delete this hardware?"
        message={
          deleteHardware?.status === "assigned"
            ? `"${deleteHardware?.serial}" is currently assigned to ${deleteHardware?.business} — deleting it will break that business's QR code immediately.`
            : `"${deleteHardware?.serial}" will be permanently removed.`
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteHardware(null)}
      />
    </>
  );
}
