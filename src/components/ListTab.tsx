"use client";

import { useState } from "react";
import type { Row, ToastFn } from "@/lib/types";
import { FIELD_LABELS, FIELD_OPTIONS, REQUIRED_FIELDS, validate } from "@/app/admin/_lib/validators";
import { AlertIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const PAGE_SIZES = [10, 25, 50, 100];

export interface PaginationControls {
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export function ListTab({
  title, rows, cols, onAdd, addFields, loading, toast, onAddClick, renderActions, secondaryAction, pagination,
}: {
  title: string;
  rows: Row[];
  cols: string[];
  onAdd?: (b: Record<string, string>) => Promise<boolean>;
  addFields?: string[];
  loading: boolean;
  toast: ToastFn;
  /** When provided, "Add New" calls this instead of toggling the built-in inline form
      (used by the Businesses tab to launch the guided onboarding wizard). */
  onAddClick?: () => void;
  renderActions?: (row: Row) => React.ReactNode;
  /** Optional secondary header button (e.g. "Upload JSON" on the Reviews tab). */
  secondaryAction?: { label: string; icon: React.ReactNode; onClick: () => void };
  /** When provided, renders a search box and page controls, backed by server-side pagination. */
  pagination?: PaginationControls;
}) {
  const fields = addFields || [];
  const emptyForm = Object.fromEntries(fields.map((f) => [f, FIELD_OPTIONS[f]?.[0] || ""]));
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const validateField = (f: string, value: Record<string, string>) => {
    const errs = validate([f], value);
    setErrors((prev) => ({ ...prev, [f]: errs[f] || "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields, form);
    setErrors(errs);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    if (Object.keys(errs).some((f) => errs[f])) {
      toast("error", "Please fix the form errors before submitting");
      return;
    }
    setSaving(true);
    const ok = await onAdd!(form);
    setSaving(false);
    if (ok) { setForm(emptyForm); setErrors({}); setTouched({}); setShowForm(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">
            {(pagination?.total ?? rows.length)} record{(pagination?.total ?? rows.length) !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 text-fg-quaternary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={pagination.search}
                onChange={(e) => pagination.onSearchChange(e.target.value)}
                placeholder="Search…"
                aria-label={`Search ${title.toLowerCase()}`}
                className="w-40 sm:w-56 pl-9"
              />
            </div>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onAddClick || (() => { setShowForm((v) => !v); setErrors({}); setTouched({}); })}
          >
            <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showForm && !onAddClick ? "rotate-45" : ""}`} />
            {showForm && !onAddClick ? "Cancel" : "Add New"}
          </Button>
        </div>
      </div>

      {showForm && !onAddClick && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6 space-y-4" noValidate>
          <h3 className="text-sm font-semibold text-fg">New Record</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f} className="space-y-1.5">
                <label htmlFor={`field-${f}`} className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">
                  {FIELD_LABELS[f] || f}
                  {REQUIRED_FIELDS[f] && <span className="text-danger ml-1">*</span>}
                </label>
                {FIELD_OPTIONS[f] ? (
                  <Select
                    id={`field-${f}`}
                    value={form[f] || FIELD_OPTIONS[f][0]}
                    error={!!errors[f]}
                    onChange={(e) => {
                      const next = { ...form, [f]: e.target.value };
                      setForm(next);
                      if (touched[f]) validateField(f, next);
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, [f]: true })); validateField(f, form); }}
                  >
                    {FIELD_OPTIONS[f].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={`field-${f}`}
                    type={f === "email" ? "email" : f === "price" ? "number" : "text"}
                    placeholder={FIELD_LABELS[f] || f}
                    value={form[f] || ""}
                    error={!!errors[f]}
                    onChange={(e) => {
                      const next = { ...form, [f]: e.target.value };
                      setForm(next);
                      if (touched[f]) validateField(f, next);
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, [f]: true })); validateField(f, form); }}
                    aria-invalid={!!errors[f]}
                  />
                )}
                {errors[f] && (
                  <p role="alert" className="flex items-center gap-1 text-xs text-danger">
                    <AlertIcon className="w-3 h-3 shrink-0" />
                    {errors[f]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" size="md" loading={saving} loadingText="Saving…">
              Save Record
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowForm(false); setErrors({}); setTouched({}); setForm(emptyForm); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <DataTable rows={rows} cols={cols} loading={loading} toast={toast} renderActions={renderActions} />

      {pagination && !loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={pagination.onPageChange} />
          <Select
            value={pagination.limit}
            onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
            className="py-1.5! text-xs cursor-pointer self-start sm:self-auto w-auto"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
          </Select>
        </div>
      )}
    </div>
  );
}
