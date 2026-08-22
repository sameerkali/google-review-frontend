"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "@/lib/types";
import { usePaginatedList } from "../_lib/usePaginatedList";
import { ListTab } from "@/components/ListTab";
import { QrViewModal } from "../_components/QrViewModal";
import { BusinessEditModal } from "../_components/BusinessEditModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EyeIcon, HardwareIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/Button";

function hasLinkedHardware(business: Row, hardwareList: Row[]): boolean {
  return hardwareList.some((h) => {
    const assigned = h.assignedBusinessId;
    const id = assigned && typeof assigned === "object" ? assigned._id : assigned;
    return id === business._id;
  });
}

export default function BusinessesPage() {
  const router = useRouter();
  const { token, authChecked, toast, openWizard } = useAdmin();
  const queryClient = useQueryClient();
  const enabled = authChecked && !!token;
  const { data: hardware = [] } = useQuery({
    queryKey: ["admin", "hardware", "all"],
    queryFn: () => api<Row[]>("/admin/hardware", { token }),
    enabled,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => api<Row[]>("/admin/plans", { token }),
    enabled,
  });
  const list = usePaginatedList(["admin", "businesses", "list"], "/admin/business", token, toast);

  // Populated planId (an object) → flatten to a plain "plan" column the shared
  // DataTable can render, instead of showing raw ids or [object Object].
  const rows = list.rows.map((b) => ({
    ...b,
    plan: b.planId && typeof b.planId === "object" ? b.planId.name : "—",
  }));

  const [qrBusiness, setQrBusiness] = useState<Row | null>(null);
  const [editBusiness, setEditBusiness] = useState<Row | null>(null);
  const [deleteBusiness, setDeleteBusiness] = useState<Row | null>(null);

  const deleteMutation = useMutation({
    mutationKey: ["admin", "businesses", "delete"],
    mutationFn: (id: string) => api(`/admin/business/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "list"] });
      toast("info", `${deleteBusiness?.name} deleted`);
      setDeleteBusiness(null);
    },
  });

  const confirmDelete = async () => {
    if (!deleteBusiness) return;
    await deleteMutation.mutateAsync(String(deleteBusiness._id)).catch(() => {});
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
            <IconButton
              onClick={() => setQrBusiness(row)}
              aria-label={`View QR for ${row.name}`}
              title={hasLinkedHardware(row, hardware) ? "View QR" : "Link a QR code"}
              tone="brand"
            >
              <EyeIcon className="w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => setEditBusiness(row)}
              aria-label={`Edit ${row.name}`}
              title="Edit"
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => setDeleteBusiness(row)}
              aria-label={`Delete ${row.name}`}
              title="Delete"
              tone="danger"
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
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
