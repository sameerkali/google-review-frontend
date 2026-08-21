"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { usePaginatedList } from "../_lib/usePaginatedList";
import { ListTab } from "../_components/ListTab";
import { QrViewModal } from "../_components/QrViewModal";
import { BusinessEditModal } from "../_components/BusinessEditModal";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { EyeIcon, HardwareIcon, PencilIcon, TrashIcon } from "../_lib/icons";

function hasLinkedHardware(business: Row, hardwareList: Row[]): boolean {
  return hardwareList.some((h) => {
    const assigned = h.assignedBusinessId;
    const id = assigned && typeof assigned === "object" ? assigned._id : assigned;
    return id === business._id;
  });
}

export default function BusinessesPage() {
  const router = useRouter();
  const { data, token, toast, openWizard, refresh } = useAdmin();
  const hardware = (data.h as Row[]) || [];
  const plans = (data.p as Row[]) || [];
  const list = usePaginatedList("/admin/business", token, toast);

  // Populated planId (an object) → flatten to a plain "plan" column the shared
  // DataTable can render, instead of showing raw ids or [object Object].
  const rows = list.rows.map((b) => ({
    ...b,
    plan: b.planId && typeof b.planId === "object" ? b.planId.name : "—",
  }));

  const [qrBusiness, setQrBusiness] = useState<Row | null>(null);
  const [editBusiness, setEditBusiness] = useState<Row | null>(null);
  const [deleteBusiness, setDeleteBusiness] = useState<Row | null>(null);

  // Both the bootstrapped admin data (used for dropdowns elsewhere) and this
  // page's own paginated slice need to reflect any change made here.
  const refreshAll = async () => { await Promise.all([refresh(), list.reload()]); };

  const confirmDelete = async () => {
    if (!deleteBusiness) return;
    try {
      await api(`/admin/business/${deleteBusiness._id}`, { method: "DELETE", token });
      await refreshAll();
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
        rows={rows}
        cols={["_id", "name", "email", "phone", "status", "plan"]}
        onAddClick={openWizard}
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
        secondaryAction={{
          label: "Hardware Stock",
          icon: <HardwareIcon className="w-4 h-4" />,
          onClick: () => router.push("/admin/hardware"),
        }}
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
          onRefresh={refreshAll}
          toast={toast}
        />
      )}

      {editBusiness && (
        <BusinessEditModal
          key={editBusiness._id}
          business={editBusiness}
          plans={plans}
          token={token}
          onClose={() => setEditBusiness(null)}
          onRefresh={refreshAll}
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
