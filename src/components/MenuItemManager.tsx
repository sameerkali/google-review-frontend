"use client";

import { CaretDownIcon, CaretUpIcon, TrashIcon } from "@/components/icons";
import { Skeleton } from "@/components/Loaders";
import { IconButton } from "@/components/ui/Button";

export type MenuManagerRow = {
  _id: string;
  name: string;
  price?: number | null;
  category?: string | null;
  active?: boolean;
};

/* Shared list UI for admin's per-business menu editor and the business's own
   self-service menu page - order here is display order on the review page's
   item chips (position 1..N = the chips shown by default; sortOrder is the
   single source of truth for both), so reordering and curation are the same
   action instead of two separate concepts. */
export function MenuItemManager({
  items, loading, reordering, onMove, onToggleActive, onDelete, emptyMessage = "No menu items yet",
}: {
  items: MenuManagerRow[];
  loading: boolean;
  reordering?: boolean;
  onMove: (row: MenuManagerRow, direction: "up" | "down") => void;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-border last:border-0 flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-sm text-fg-tertiary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {items.map((row, i) => (
        <div key={row._id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-surface/60 transition-colors">
          <div className="flex flex-col shrink-0">
            <button
              type="button"
              onClick={() => onMove(row, "up")}
              disabled={i === 0 || reordering}
              aria-label={`Move ${row.name} up`}
              className="p-0.5 text-fg-quaternary hover:text-fg disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretUpIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(row, "down")}
              disabled={i === items.length - 1 || reordering}
              aria-label={`Move ${row.name} down`}
              className="p-0.5 text-fg-quaternary hover:text-fg disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretDownIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg-secondary truncate">{row.name}</p>
            <p className="text-xs text-fg-quaternary truncate">
              {row.category || "Uncategorized"}
              {row.price != null ? ` · ₹${row.price}` : ""}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={row.active !== false}
            aria-label={row.active !== false ? `Deactivate ${row.name}` : `Activate ${row.name}`}
            onClick={() => onToggleActive(row, row.active === false)}
            title={row.active !== false ? "Active - shown on the review page" : "Inactive - hidden from the review page"}
            className={`shrink-0 relative w-9 h-5 rounded-full transition-colors cursor-pointer ${row.active !== false ? "bg-brand" : "bg-surface-inset border border-border-strong"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.active !== false ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>

          <IconButton onClick={() => onDelete(row)} aria-label={`Delete ${row.name}`} title="Delete" tone="danger">
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
