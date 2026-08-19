"use client";

import type { Row, ToastFn } from "../_lib/types";
import { Skeleton } from "./Loaders";

/* Populated Mongoose refs (e.g. businessId) arrive as full objects, not ids —
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
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  suspended: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
  damaged: "bg-red-500/10 text-red-400 border-red-500/20",
};
const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-400",
  assigned: "bg-blue-400",
  available: "bg-emerald-400",
  suspended: "bg-amber-400",
  expired: "bg-red-400",
  lost: "bg-red-400",
  damaged: "bg-red-400",
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
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex gap-6">
          {cols.map((c) => <Skeleton key={c} className="h-3 w-16" />)}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-zinc-800 flex gap-6">
            {cols.map((c) => <Skeleton key={c} className="h-3 w-20" />)}
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500">No records yet</p>
        <p className="text-xs text-zinc-600 mt-1">Add your first record using the button above</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-zinc-900 border-b border-zinc-800">
            {cols.map((c) => (
              <th key={c} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                {c === "_id" ? "ID" : c.replace(/([A-Z])/g, " $1").trim()}
              </th>
            ))}
            {renderActions && <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id ?? i} className="border-b border-zinc-800 hover:bg-zinc-900/60 transition-colors duration-100">
              {cols.map((c) => (
                <td
                  key={c}
                  className={`px-4 py-3 text-zinc-300 whitespace-nowrap max-w-xs truncate ${c === "_id" ? "font-mono text-xs cursor-pointer hover:text-emerald-400" : ""}`}
                  title={c === "_id" ? "Click to copy" : undefined}
                  onClick={
                    c === "_id" && row[c]
                      ? () => {
                          navigator.clipboard
                            .writeText(String(row[c]))
                            .then(() => toast?.("info", "ID copied to clipboard"))
                            .catch(() => toast?.("error", "Could not copy to clipboard"));
                        }
                      : undefined
                  }
                >
                  {c === "status" ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_TONE[String(row[c])] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[String(row[c])] || "bg-zinc-500"}`} />
                      {cellText(row[c])}
                    </span>
                  ) : (
                    cellText(row[c])
                  )}
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
  );
}
