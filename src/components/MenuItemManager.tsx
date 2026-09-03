"use client";

import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleIcon, TrashIcon } from "@/components/icons";
import { Skeleton } from "@/components/Loaders";
import { IconButton } from "@/components/ui/Button";

export type MenuManagerRow = {
  _id: string;
  name: string;
  price?: number | null;
  category?: string | null;
  active?: boolean;
};

function ActiveToggle({ row, onToggleActive }: { row: MenuManagerRow; onToggleActive: (row: MenuManagerRow, active: boolean) => void }) {
  const active = row.active !== false;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? `Deactivate ${row.name}` : `Activate ${row.name}`}
      onClick={() => onToggleActive(row, !active)}
      title={active ? "Active - shown on the review page" : "Inactive - hidden from the review page"}
      className={`group/toggle shrink-0 relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        active ? "bg-brand shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" : "bg-fg-quaternary/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out group-active/toggle:scale-90 ${
          active ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function RowContent({
  row, onToggleActive, onDelete, dragHandleProps, overlay,
}: {
  row: MenuManagerRow;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
  dragHandleProps?: Record<string, unknown>;
  overlay?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 bg-surface ${
        overlay ? "rounded-xl border border-border-strong shadow-xl" : "border-b border-border last:border-0 transition-colors hover:bg-surface/60"
      }`}
    >
      <button
        type="button"
        {...dragHandleProps}
        aria-label={`Drag to reorder ${row.name}`}
        className="shrink-0 -ml-1 p-1.5 rounded-lg text-fg-quaternary hover:text-fg-tertiary hover:bg-surface-inset transition-colors touch-none cursor-grab active:cursor-grabbing"
      >
        <DragHandleIcon className="w-4 h-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg-secondary truncate">{row.name}</p>
        <p className="text-xs text-fg-quaternary truncate">
          {row.category || "Uncategorized"}
          {row.price != null ? ` · ₹${row.price}` : ""}
        </p>
      </div>

      <ActiveToggle row={row} onToggleActive={onToggleActive} />

      <IconButton onClick={() => onDelete(row)} aria-label={`Delete ${row.name}`} title="Delete" tone="danger">
        <TrashIcon className="w-4 h-4" />
      </IconButton>
    </div>
  );
}

function SortableRow({
  row, onToggleActive, onDelete,
}: {
  row: MenuManagerRow;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row._id });
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-0" : ""}>
      <RowContent row={row} onToggleActive={onToggleActive} onDelete={onDelete} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

/* Shared list UI for admin's per-business menu editor and the business's own
   self-service menu page - order here is display order on the review page's
   item chips (position 1..N = the chips shown by default; sortOrder is the
   single source of truth for both), so reordering and curation are the same
   action instead of two separate concepts.

   Drag (not click-to-move buttons) via dnd-kit: a small pointer-move
   threshold on desktop so a plain click never misfires as a drag, and a
   short hold-then-drag on touch so a reorder gesture doesn't fight the
   page's own vertical scroll. Both the toggle and the reorder are wired by
   the caller to update optimistically - this component just fires the
   intent (new order / new active state) and re-renders whatever `items` it
   was given next, it doesn't wait on anything itself. */
export function MenuItemManager({
  items, loading, onReorder, onToggleActive, onDelete, emptyMessage = "No menu items yet",
}: {
  items: MenuManagerRow[];
  loading: boolean;
  onReorder: (orderedIds: string[]) => void;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
  emptyMessage?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

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

  const activeRow = activeId ? items.find((r) => r._id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((r) => r._id === active.id);
    const newIndex = items.findIndex((r) => r._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex).map((r) => r._id));
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={items.map((r) => r._id)} strategy={verticalListSortingStrategy}>
          {items.map((row) => (
            <SortableRow key={row._id} row={row} onToggleActive={onToggleActive} onDelete={onDelete} />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeRow ? <RowContent row={activeRow} onToggleActive={onToggleActive} onDelete={onDelete} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
