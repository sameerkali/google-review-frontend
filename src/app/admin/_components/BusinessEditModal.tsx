"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { BUSINESS_STATUS_OPTIONS, sanitizePhone, validate, validators } from "../_lib/validators";
import { AlertIcon } from "@/components/icons";
import { generatePassword } from "../_lib/generatePassword";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Label } from "@/components/ui/Input";
import { guardedClose } from "@/lib/utils";

const FIELDS: { f: string; label: string; required?: boolean }[] = [
  { f: "name", label: "Business Name", required: true },
  { f: "email", label: "Email Address", required: true },
  { f: "phone", label: "Phone Number" },
  { f: "address", label: "Address" },
  { f: "city", label: "City" },
  { f: "website", label: "Website" },
  { f: "googleReviewUrl", label: "Google Review URL" },
];

function planId(business: Row | null): string {
  const p = business?.planId;
  return p && typeof p === "object" ? p._id : p || "";
}

export function BusinessEditModal({
  business, plans, token, onClose, toast,
}: {
  business: Row | null;
  plans: Row[];
  token: string;
  onClose: () => void;
  toast: ToastFn;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: business?.address || "",
    city: business?.city || "",
    website: business?.website || "",
    googleReviewUrl: business?.googleReviewUrl || "",
  });
  const [status, setStatus] = useState(business?.status || "active");
  const [plan, setPlan] = useState(planId(business));
  const [newPassword, setNewPassword] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const saveMutation = useMutation({
    mutationKey: ["admin", "businesses", "update"],
    mutationFn: (body: Record<string, unknown>) => api(`/admin/business/${business?._id}`, { method: "PUT", token, body }),
    meta: { toastOnError: false }, // inline field/server error below
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast("success", newPassword.trim() ? "Business updated - portal password changed" : "Business updated");
      onClose();
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Could not update business";
      if (/email/i.test(msg)) setErrors((prev) => ({ ...prev, email: "This email is already registered to another business" }));
      setServerError(msg);
    },
  });
  useEscapeKey(onClose, !!business && !saveMutation.isPending);

  if (!business) return null;

  const save = () => {
    const fieldNames = FIELDS.map((f) => f.f);
    const errs = validate(fieldNames, form);
    setErrors(errs);
    const pwErr = validators.password(newPassword) || "";
    setPasswordErr(pwErr);
    if (Object.values(errs).some(Boolean) || pwErr) return;
    setServerError("");
    saveMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      website: form.website.trim() || undefined,
      googleReviewUrl: form.googleReviewUrl.trim() || undefined,
      status,
      planId: plan || null,
      password: newPassword.trim() || undefined,
    });
  };

  return (
    <Modal open={!!business} onClose={guardedClose(onClose, saveMutation.isPending)} maxWidth="md" labelledBy="biz-edit-title">
      <div className="max-h-[85vh] flex flex-col">
        <ModalHeader onClose={guardedClose(onClose, saveMutation.isPending)}>
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
                  type={f === "email" ? "email" : f === "phone" ? "tel" : "text"}
                  inputMode={f === "phone" ? "numeric" : undefined}
                  maxLength={f === "phone" ? 10 : undefined}
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: f === "phone" ? sanitizePhone(e.target.value) : e.target.value })}
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
                  maxLength={14}
                  onChange={(e) => { setNewPassword(e.target.value); if (passwordErr) setPasswordErr(""); }}
                  placeholder="Leave blank to keep current password"
                  className="flex-1 min-w-0 font-mono"
                  aria-invalid={!!passwordErr}
                  error={!!passwordErr}
                />
                <Button type="button" variant="secondary" onClick={() => setNewPassword(generatePassword())} className="shrink-0">
                  Generate
                </Button>
              </div>
              {passwordErr && (
                <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                  <AlertIcon className="w-3 h-3 shrink-0" />
                  {passwordErr}
                </p>
              )}
              {!passwordErr && newPassword.trim() && (
                <p className="mt-1.5 text-xs text-warning">New password: <span className="font-mono">{newPassword.trim()}</span> - copy it now, it won&apos;t be shown again after saving.</p>
              )}
            </div>
          </ModalBody>
        </div>

        <ModalFooter>
          <Button onClick={save} loading={saveMutation.isPending} loadingText="Saving…" variant="primary" className="ml-auto">
            Save Changes
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
