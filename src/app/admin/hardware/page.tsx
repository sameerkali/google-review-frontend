"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { token, authChecked, toast } = useAdmin();
  const queryClient = useQueryClient();
  const { data: businesses = [] } = useQuery({
    queryKey: ["admin", "businesses", "all"],
    queryFn: () => api<Row[]>("/admin/business", { token }),
    enabled: authChecked && !!token,
  });
  const list = usePaginatedList(["admin", "hardware", "list"], "/admin/hardware", token, toast);

  // Populated assignedBusinessId (an object) → flatten to a plain "business" column
  // the shared DataTable can render, instead of showing raw ids or [object Object].
  const rows = list.rows.map((h) => ({
    ...h,
    business: h.assignedBusinessId && typeof h.assignedBusinessId === "object" ? h.assignedBusinessId.name : "—",
  }));

  const [editHardware, setEditHardware] = useState<Row | null>(null);
  const [deleteHardware, setDeleteHardware] = useState<Row | null>(null);

  const invalidateHardware = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "list"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "all"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const addMutation = useMutation({
    mutationKey: ["admin", "hardware", "add"],
    mutationFn: (body: Record<string, string>) => api<Row>("/admin/hardware", { method: "POST", token, body: { items: [body] } }),
    onSuccess: () => {
      invalidateHardware();
      toast("success", "Created successfully");
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["admin", "hardware", "delete"],
    mutationFn: (id: string) => api(`/admin/hardware/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      invalidateHardware();
      toast("info", `Hardware "${deleteHardware?.serial}" deleted`);
      setDeleteHardware(null);
    },
  });

  const confirmDelete = async () => {
    if (!deleteHardware) return;
    await deleteMutation.mutateAsync(String(deleteHardware._id)).catch(() => {});
  };

  return (
    <>
      <ListTab
        title="Hardware Management"
        rows={rows}
        cols={["type", "serial", "business", "status"]}
        onAdd={(body) => addMutation.mutateAsync(body).then(() => true, () => false)}
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
