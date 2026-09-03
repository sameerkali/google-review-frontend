"use client";

import type { Row, ToastFn } from "@/lib/types";
import { Skeleton } from "@/components/Loaders";
import { TrayIcon } from "./icons";

/* Populated Mongoose refs (e.g. businessId) arrive as full objects, not ids -
   render something human-readable instead of the default "[object Object]". */
function cellText(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    const obj = value as Row;
    return obj.name || obj._id || JSON.stringify(obj);
  }
  return String(value);
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  assigned: "bg-info/10 text-info border-info/20",
  available: "bg-success/10 text-success border-success/20",
  suspended: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-danger/10 text-danger border-danger/20",
  lost: "bg-danger/10 text-danger border-danger/20",
  damaged: "bg-danger/10 text-danger border-danger/20",
  unused: "bg-surface-inset text-fg-tertiary border-border-strong",
  reserved: "bg-warning/10 text-warning border-warning/20",
  used: "bg-success/10 text-success border-success/20",
};
const STATUS_DOT: Record<string, string> = {
  active: "bg-success",
  assigned: "bg-info",
  available: "bg-success",
  suspended: "bg-warning",
  expired: "bg-danger",
  lost: "bg-danger",
  damaged: "bg-danger",
  unused: "bg-fg-quaternary",
  reserved: "bg-warning",
  used: "bg-success",
};

export function DataTable({
  rows, cols, loading, toast, renderActions,
}: {
  rows: Row[];
  cols: string[];
  loading: boolean;
  toast?: ToastFn;
  /** Renders an extra trailing "Actions" column per row (edit/delete/view etc.) */
  renderActions?: (row: Row) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="bg-surface px-4 py-3 border-b border-border flex gap-6">
          {cols.map((c) => <Skeleton key={c} className="h-3 w-16" />)}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-border flex gap-6">
            {cols.map((c) => <Skeleton key={c} className="h-3 w-20" />)}
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-surface-inset flex items-center justify-center mx-auto mb-3">
          <TrayIcon className="w-5 h-5 text-fg-quaternary" />
        </div>
        <p className="text-sm text-fg-tertiary">No records yet</p>
        <p className="text-xs text-fg-quaternary mt-1">Add your first record using the button above</p>
      </div>
    );
  }

  const copyCell = (c: string, row: Row) => {
    if (c !== "_id" || !row[c]) return undefined;
    return () => {
      navigator.clipboard
        .writeText(String(row[c]))
        .then(() => toast?.("info", "ID copied to clipboard"))
        .catch(() => toast?.("error", "Could not copy to clipboard"));
    };
  };

  const cellLabel = (c: string) => (c === "_id" ? "ID" : c.replace(/([A-Z])/g, " $1").trim());

  const cellContent = (c: string, row: Row) =>
    c === "status" ? (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_TONE[String(row[c])] || "bg-surface-inset text-fg-tertiary border-border-strong"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[String(row[c])] || "bg-fg-quaternary"}`} />
        {cellText(row[c])}
      </span>
    ) : (
      cellText(row[c])
    );

  return (
    <>
      {/* Card layout - small screens, where a wide table would force horizontal scrolling */}
      <div className="space-y-3 sm:hidden">
        {rows.map((row, i) => (
          <div key={row._id ?? i} className="rounded-2xl border border-border bg-surface p-4 space-y-2.5">
            {cols.map((c) => (
              <div key={c} className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider shrink-0 pt-0.5">{cellLabel(c)}</span>
                <span
                  className={`text-sm text-fg-secondary text-right wrap-break-word min-w-0 ${c === "_id" ? "font-mono text-xs cursor-pointer hover:text-brand" : ""}`}
                  onClick={copyCell(c, row)}
                >
                  {cellContent(c, row)}
                </span>
              </div>
            ))}
            {renderActions && (
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border">{renderActions(row)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Table layout - sm and up */}
      <div className="hidden sm:block rounded-2xl border border-border overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              {cols.map((c) => (
                <th key={c} className="px-4 py-3 text-xs font-semibold text-fg-tertiary uppercase tracking-wider whitespace-nowrap">
                  {cellLabel(c)}
                </th>
              ))}
              {renderActions && <th className="px-4 py-3 text-xs font-semibold text-fg-tertiary uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row._id ?? i} className="border-b border-border hover:bg-surface/60 transition-colors duration-100">
                {cols.map((c) => (
                  <td
                    key={c}
                    className={`px-4 py-3 text-fg-secondary whitespace-nowrap max-w-xs truncate ${c === "_id" ? "font-mono text-xs cursor-pointer hover:text-brand" : ""}`}
                    title={c === "_id" ? "Click to copy" : undefined}
                    onClick={copyCell(c, row)}
                  >
                    {cellContent(c, row)}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">{renderActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
