"use client";

import { useState } from "react";
import type { Row, ToastFn } from "../_lib/types";
import { FIELD_LABELS, FIELD_OPTIONS, REQUIRED_FIELDS, validate } from "../_lib/validators";
import { AlertIcon, PlusIcon, SearchIcon } from "../_lib/icons";
import { Spinner } from "./Loaders";
import { DataTable } from "./DataTable";
import { Pagination } from "./Pagination";

const PAGE_SIZES = [10, 25, 50, 100];

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
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {(pagination?.total ?? rows.length)} record{(pagination?.total ?? rows.length) !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={pagination.search}
                onChange={(e) => pagination.onSearchChange(e.target.value)}
                placeholder="Search…"
                className="w-40 sm:w-56 rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/15 transition-all duration-200"
              />
            </div>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          )}
          <button
            onClick={onAddClick || (() => { setShowForm((v) => !v); setErrors({}); setTouched({}); })}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
          >
            <PlusIcon className={`w-4 h-4 transition-transform duration-200 ${showForm && !onAddClick ? "rotate-45" : ""}`} strokeWidth={2} />
            {showForm && !onAddClick ? "Cancel" : "Add New"}
          </button>
        </div>
      </div>

      {showForm && !onAddClick && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4" noValidate>
          <h3 className="text-sm font-semibold text-white">New Record</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f} className="space-y-1.5">
                <label htmlFor={`field-${f}`} className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {FIELD_LABELS[f] || f}
                  {REQUIRED_FIELDS[f] && <span className="text-red-400 ml-1">*</span>}
                </label>
                {FIELD_OPTIONS[f] ? (
                  <select
                    id={`field-${f}`}
                    value={form[f] || FIELD_OPTIONS[f][0]}
                    onChange={(e) => {
                      const next = { ...form, [f]: e.target.value };
                      setForm(next);
                      if (touched[f]) validateField(f, next);
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, [f]: true })); validateField(f, form); }}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none transition-all duration-200 focus:ring-1 ${
                      errors[f]
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                    }`}
                  >
                    {FIELD_OPTIONS[f].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`field-${f}`}
                    type={f === "email" ? "email" : f === "price" ? "number" : "text"}
                    placeholder={FIELD_LABELS[f] || f}
                    value={form[f] || ""}
                    onChange={(e) => {
                      const next = { ...form, [f]: e.target.value };
                      setForm(next);
                      if (touched[f]) validateField(f, next);
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, [f]: true })); validateField(f, form); }}
                    aria-invalid={!!errors[f]}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                      errors[f]
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                    }`}
                  />
                )}
                {errors[f] && (
                  <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
                    <AlertIcon className="w-3 h-3 shrink-0" strokeWidth={2} />
                    {errors[f]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? <><Spinner /> Saving…</> : "Save Record"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setErrors({}); setTouched({}); setForm(emptyForm); }}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable rows={rows} cols={cols} loading={loading} toast={toast} renderActions={renderActions} />

      {pagination && !loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={pagination.onPageChange} />
          <select
            value={pagination.limit}
            onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 cursor-pointer self-start sm:self-auto"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
