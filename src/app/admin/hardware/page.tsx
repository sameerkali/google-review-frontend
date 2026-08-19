"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { ListTab } from "../_components/ListTab";
import { HardwareEditModal } from "../_components/HardwareEditModal";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { PencilIcon, TrashIcon } from "../_lib/icons";

export default function HardwarePage() {
  const { data, dataLoading, token, toast, create, refresh } = useAdmin();
  const hardwareRaw = (data.h as Row[]) || [];
  const businesses = (data.b as Row[]) || [];

  // Populated assignedBusinessId (an object) → flatten to a plain "business" column
  // the shared DataTable can render, instead of showing raw ids or [object Object].
  const rows = hardwareRaw.map((h) => ({
    ...h,
    business: h.assignedBusinessId && typeof h.assignedBusinessId === "object" ? h.assignedBusinessId.name : "—",
  }));

  const [editHardware, setEditHardware] = useState<Row | null>(null);
  const [deleteHardware, setDeleteHardware] = useState<Row | null>(null);

  const confirmDelete = async () => {
    if (!deleteHardware) return;
    try {
      await api(`/admin/hardware/${deleteHardware._id}`, { method: "DELETE", token });
      await refresh();
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
        onAdd={(body) => create("hardware", { items: [body] }).then(Boolean)}
        addFields={["type", "serial"]}
        loading={dataLoading}
        toast={toast}
        renderActions={(row) => (
          <>
            <button
              onClick={() => setEditHardware(row)}
              aria-label={`Edit ${row.serial}`}
              title="Edit"
              className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteHardware(row)}
              aria-label={`Delete ${row.serial}`}
              title="Delete"
              className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
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
          onRefresh={refresh}
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
