"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { HARDWARE_STATUS_OPTIONS } from "../_lib/validators";
import { invalidateHardwareQueries } from "../_lib/queryKeys";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Label } from "@/components/ui/Input";
import { populatedId, guardedClose } from "@/lib/utils";

/* Full edit for a hardware/QR record: rename its serial, change type/status,
   or reassign it to a different business - the "U" in CRUD for hardware. */
export function HardwareEditModal({
  hardware, businesses, token, onClose, toast,
}: {
  hardware: Row | null;
  businesses: Row[];
  token: string;
  onClose: () => void;
  toast: ToastFn;
}) {
  const queryClient = useQueryClient();
  const linkedId = populatedId(hardware?.assignedBusinessId) as string | undefined;

  const [type, setType] = useState(hardware?.type || "QR");
  const [serial, setSerial] = useState(hardware?.serial || "");
  const [status, setStatus] = useState(hardware?.status || "available");
  const [businessId, setBusinessId] = useState(linkedId || "");
  const [serialErr, setSerialErr] = useState("");

  const saveMutation = useMutation({
    mutationKey: ["admin", "hardware", "update"],
    mutationFn: (body: Record<string, unknown>) => api(`/admin/hardware/${hardware?._id}`, { method: "PUT", token, body }),
    onSuccess: () => {
      invalidateHardwareQueries(queryClient);
      toast("success", "Hardware updated");
      onClose();
    },
  });
  useEscapeKey(onClose, !!hardware && !saveMutation.isPending);

  if (!hardware) return null;

  const save = () => {
    if (!serial.trim()) { setSerialErr("Serial is required"); return; }
    setSerialErr("");
    saveMutation.mutate({
      type,
      serial: serial.trim(),
      status,
      assignedBusinessId: status === "assigned" ? (businessId || null) : null,
    });
  };

  return (
    <Modal open={!!hardware} onClose={guardedClose(onClose, saveMutation.isPending)} maxWidth="md" labelledBy="hw-edit-title">
      <ModalHeader onClose={guardedClose(onClose, saveMutation.isPending)}>
        <h2 id="hw-edit-title" className="text-sm font-semibold text-fg">Edit Hardware</h2>
      </ModalHeader>

      <ModalBody>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hw-type">Type</Label>
            <Select id="hw-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="QR">QR</option>
              <option value="NFC">NFC</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="hw-status">Status</Label>
            <Select
              id="hw-status"
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                setStatus(v);
                if (v !== "assigned") setBusinessId("");
              }}
            >
              {HARDWARE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>

        <Field label="Serial Number" htmlFor="hw-serial" error={serialErr}>
          <Input
            id="hw-serial"
            value={serial}
            onChange={(e) => { setSerial(e.target.value); if (serialErr) setSerialErr(""); }}
            error={!!serialErr}
            className="font-mono"
          />
        </Field>

        {status === "assigned" && (
          <div>
            <Label htmlFor="hw-business">Assigned Business</Label>
            <Select id="hw-business" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
              <option value="">— none —</option>
              {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button onClick={save} loading={saveMutation.isPending} loadingText="Saving…" variant="primary" className="ml-auto">
          Save Changes
        </Button>
      </ModalFooter>
    </Modal>
  );
}
