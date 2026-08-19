"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { ListTab } from "../_components/ListTab";
import { QrViewModal } from "../_components/QrViewModal";
import { BusinessEditModal } from "../_components/BusinessEditModal";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { EyeIcon, PencilIcon, TrashIcon } from "../_lib/icons";

function hasLinkedHardware(business: Row, hardwareList: Row[]): boolean {
  return hardwareList.some((h) => {
    const assigned = h.assignedBusinessId;
    const id = assigned && typeof assigned === "object" ? assigned._id : assigned;
    return id === business._id;
  });
}

export default function BusinessesPage() {
  const { data, dataLoading, token, toast, openWizard, refresh } = useAdmin();
  const businesses = (data.b as Row[]) || [];
  const hardware = (data.h as Row[]) || [];

  const [qrBusiness, setQrBusiness] = useState<Row | null>(null);
  const [editBusiness, setEditBusiness] = useState<Row | null>(null);
  const [deleteBusiness, setDeleteBusiness] = useState<Row | null>(null);

  const confirmDelete = async () => {
    if (!deleteBusiness) return;
    try {
      await api(`/admin/business/${deleteBusiness._id}`, { method: "DELETE", token });
      await refresh();
      toast("info", `${deleteBusiness.name} deleted`);
      setDeleteBusiness(null);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Could not delete business");
    }
  };

  return (
    <>
      <ListTab
        title="Business Management"
        rows={businesses}
        cols={["_id", "name", "email", "phone", "status"]}
        onAddClick={openWizard}
        loading={dataLoading}
        toast={toast}
        renderActions={(row) => (
          <>
            <button
              onClick={() => setQrBusiness(row)}
              aria-label={`View QR for ${row.name}`}
              title={hasLinkedHardware(row, hardware) ? "View QR" : "Link a QR code"}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditBusiness(row)}
              aria-label={`Edit ${row.name}`}
              title="Edit"
              className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteBusiness(row)}
              aria-label={`Delete ${row.name}`}
              title="Delete"
              className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </>
        )}
      />

      {qrBusiness && (
        <QrViewModal
          key={qrBusiness._id}
          business={qrBusiness}
          hardwareList={hardware}
          token={token}
          onClose={() => setQrBusiness(null)}
          onRefresh={refresh}
          toast={toast}
        />
      )}

      {editBusiness && (
        <BusinessEditModal
          key={editBusiness._id}
          business={editBusiness}
          token={token}
          onClose={() => setEditBusiness(null)}
          onRefresh={refresh}
          toast={toast}
        />
      )}

      <ConfirmDialog
        open={!!deleteBusiness}
        title="Delete this business?"
        message={`"${deleteBusiness?.name}" and its review-suggestion pool will be permanently removed. Any linked QR code will be freed back to available stock.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteBusiness(null)}
      />
    </>
  );
}
