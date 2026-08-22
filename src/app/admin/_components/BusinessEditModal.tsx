"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { BUSINESS_STATUS_OPTIONS, validate } from "../_lib/validators";
import { AlertIcon } from "@/components/icons";
import { generatePassword } from "../_lib/generatePassword";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Label } from "@/components/ui/Input";

const FIELDS: { f: string; label: string; required?: boolean }[] = [
  { f: "name", label: "Business Name", required: true },
  { f: "email", label: "Email Address", required: true },
  { f: "phone", label: "Phone Number" },
  { f: "address", label: "Address" },
  { f: "googleReviewUrl", label: "Google Review URL" },
];

function planId(business: Row | null): string {
  const p = business?.planId;
  return p && typeof p === "object" ? p._id : p || "";
}

export function BusinessEditModal({
  business, plans, token, onClose, onRefresh, toast,
}: {
  business: Row | null;
  plans: Row[];
  token: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: business?.address || "",
    googleReviewUrl: business?.googleReviewUrl || "",
  });
  const [status, setStatus] = useState(business?.status || "active");
  const [plan, setPlan] = useState(planId(business));
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  useEscapeKey(onClose, !!business && !saving);

  if (!business) return null;

  const save = async () => {
    const fieldNames = FIELDS.map((f) => f.f);
    const errs = validate(fieldNames, form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setServerError("");
    setSaving(true);
    try {
      await api(`/admin/business/${business._id}`, {
        method: "PUT",
        token,
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          googleReviewUrl: form.googleReviewUrl.trim() || undefined,
          status,
          planId: plan || null,
          password: newPassword.trim() || undefined,
        },
      });
      await onRefresh();
      toast("success", newPassword.trim() ? "Business updated — portal password changed" : "Business updated");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update business";
      if (/email/i.test(msg)) setErrors((prev) => ({ ...prev, email: "This email is already registered to another business" }));
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!business} onClose={saving ? undefined : onClose} maxWidth="md" labelledBy="biz-edit-title">
      <div className="max-h-[85vh] flex flex-col">
        <ModalHeader onClose={saving ? undefined : onClose}>
          <h2 id="biz-edit-title" className="text-sm font-semibold text-fg">Edit Business</h2>
        </ModalHeader>

        <div className="overflow-y-auto">
          <ModalBody>
            {serverError && (
              <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-start gap-2">
                <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {FIELDS.map(({ f, label, required }) => (
              <Field key={f} label={`${label}${required ? " *" : ""}`} htmlFor={`biz-edit-${f}`} error={errors[f]}>
                <Input
                  id={`biz-edit-${f}`}
                  type={f === "email" ? "email" : "text"}
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  aria-invalid={!!errors[f]}
                  error={!!errors[f]}
                />
              </Field>
            ))}

            <div>
              <Label htmlFor="biz-edit-status">Status</Label>
              <Select id="biz-edit-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {BUSINESS_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

            <div>
              <Label htmlFor="biz-edit-plan">Plan</Label>
              <Select id="biz-edit-plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="">— none —</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
            </div>

            <div>
              <Label htmlFor="biz-edit-password">Reset Portal Password</Label>
              <div className="flex gap-2">
                <Input
                  id="biz-edit-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="flex-1 min-w-0 font-mono"
                />
                <Button type="button" variant="secondary" onClick={() => setNewPassword(generatePassword())} className="shrink-0">
                  Generate
                </Button>
              </div>
              {newPassword.trim() && (
                <p className="mt-1.5 text-xs text-warning">New password: <span className="font-mono">{newPassword.trim()}</span> — copy it now, it won&apos;t be shown again after saving.</p>
              )}
            </div>
          </ModalBody>
        </div>

        <ModalFooter>
          <Button onClick={save} loading={saving} loadingText="Saving…" variant="primary" className="ml-auto">
            Save Changes
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
