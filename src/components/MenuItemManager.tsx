"use client";

import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, closestCenter, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleIcon, StarFillIcon, TrashIcon } from "@/components/icons";
import { Skeleton } from "@/components/Loaders";
import { IconButton } from "@/components/ui/Button";

export type MenuManagerRow = {
  _id: string;
  name: string;
  price?: number | null;
  category?: string | null;
  active?: boolean;
  featured?: boolean;
};

type SortMode = "order" | "name";
type GroupMode = "none" | "category";
const FEATURED_CAP = 8; // matches the review page's default chip count

// ─── Toggle ─────────────────────────────────────────────────────────────────

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

// ─── Row ────────────────────────────────────────────────────────────────────

function RowContent({
  row, onToggleActive, onDelete, dragHandleProps, overlay, dimmed,
}: {
  row: MenuManagerRow;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
  dragHandleProps?: Record<string, unknown>;
  overlay?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 bg-surface ${
        overlay ? "rounded-xl border border-border-strong shadow-xl" : "border-b border-border last:border-0 transition-colors hover:bg-surface/60"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        {...dragHandleProps}
        disabled={!dragHandleProps}
        aria-label={`Drag to reorder ${row.name}`}
        className="shrink-0 -ml-1 p-1.5 rounded-lg text-fg-quaternary hover:text-fg-tertiary hover:bg-surface-inset transition-colors touch-none cursor-grab active:cursor-grabbing disabled:opacity-0 disabled:cursor-default"
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
  row, onToggleActive, onDelete, draggable,
}: {
  row: MenuManagerRow;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row._id, disabled: !draggable });
  const style = { transform: CSS.Translate.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-0" : ""}>
      <RowContent
        row={row}
        onToggleActive={onToggleActive}
        onDelete={onDelete}
        dragHandleProps={draggable ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}

// ─── Featured zone ──────────────────────────────────────────────────────────

function FeaturedZone({ items, onToggleActive, onDelete }: { items: MenuManagerRow[]; onToggleActive: (row: MenuManagerRow, active: boolean) => void; onDelete: (row: MenuManagerRow) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "featured" });
  const overCap = items.length > FEATURED_CAP;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${isOver ? "border-brand bg-brand/5" : "border-border"}`}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-warning/5 border-b border-border">
        <div className="flex items-center gap-2">
          <StarFillIcon className="w-4 h-4 text-warning" />
          <span className="text-sm font-semibold text-fg">Featured on review page</span>
        </div>
        <span className={`text-xs font-medium tabular-nums ${overCap ? "text-warning" : "text-fg-quaternary"}`}>{items.length}/{FEATURED_CAP} shown</span>
      </div>

      <SortableContext items={items.map((r) => r._id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={items.length ? "" : "min-h-18"}>
          {items.length ? (
            items.map((row) => <SortableRow key={row._id} row={row} onToggleActive={onToggleActive} onDelete={onDelete} draggable />)
          ) : (
            <div className="flex items-center justify-center h-18 px-4 text-center">
              <p className="text-xs text-fg-quaternary">Drag items here from the list below to feature them</p>
            </div>
          )}
        </div>
      </SortableContext>

      {overCap && (
        <p className="px-4 py-2 text-xs text-warning bg-warning/5 border-t border-border">
          Only the first {FEATURED_CAP} (by order above) actually show as chips - reorder to change which ones.
        </p>
      )}
    </div>
  );
}

// ─── Rest-of-list zone ──────────────────────────────────────────────────────

function RestZone({
  items, sortMode, groupMode, onToggleActive, onDelete,
}: {
  items: MenuManagerRow[];
  sortMode: SortMode;
  groupMode: GroupMode;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "rest" });
  const draggable = sortMode === "order";

  const groups = useMemo(() => {
    if (groupMode !== "category") return [{ label: null as string | null, rows: items }];
    const byCategory = new Map<string, MenuManagerRow[]>();
    for (const row of items) {
      const key = row.category?.trim() || "Uncategorized";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(row);
    }
    return [...byCategory.entries()].map(([label, rows]) => ({ label, rows }));
  }, [items, groupMode]);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${isOver ? "border-brand bg-brand/5" : "border-border"}`}>
      <SortableContext items={items.map((r) => r._id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef}>
          {!items.length && (
            <div className="flex items-center justify-center h-24 px-4 text-center">
              <p className="text-xs text-fg-quaternary">Nothing here</p>
            </div>
          )}
          {groups.map((g, gi) => (
            <div key={g.label ?? "all"}>
              {g.label && (
                <p className={`px-4 py-2 text-xs font-semibold text-fg-tertiary uppercase tracking-wider bg-surface-inset/50 ${gi > 0 ? "border-t border-border" : ""}`}>
                  {g.label}
                </p>
              )}
              {g.rows.map((row) => (
                <SortableRow key={row._id} row={row} onToggleActive={onToggleActive} onDelete={onDelete} draggable={draggable} />
              ))}
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── View controls ──────────────────────────────────────────────────────────

function SegmentedControl<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            value === o.value ? "bg-brand text-white" : "text-fg-tertiary hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────

/* Shared list UI for admin's per-business menu editor and the business's own
   self-service menu page.

   Two drag zones:
   - "Featured" - items shown here (up to FEATURED_CAP, in this order) are
     exactly the default chips a customer sees on the review page's item
     step. Drag an item in to feature it, out to un-feature it, or within it
     to change chip order.
   - Everything else - the rest of the menu, with view-only sort/group
     controls (they never change what's stored, only how this list is laid
     out for browsing/finding an item to drag).

   Every drag - within a zone, or across the two - resolves to the same pair
   of calls: `onReorder` with the *complete* new id order (featured items
   first, in their new order, then the rest), and, only for a cross-zone
   move, `onSetFeatured` for the one item that crossed. Both already map
   directly onto the existing reorder/PUT endpoints - no new endpoint shape,
   just one new boolean field to carry. */
export function MenuItemManager({
  items, loading, onReorder, onSetFeatured, onToggleActive, onDelete, emptyMessage = "No menu items yet",
}: {
  items: MenuManagerRow[];
  loading: boolean;
  onReorder: (orderedIds: string[]) => void;
  onSetFeatured: (row: MenuManagerRow, featured: boolean) => void;
  onToggleActive: (row: MenuManagerRow, active: boolean) => void;
  onDelete: (row: MenuManagerRow) => void;
  emptyMessage?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("order");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  // Featured always in its own sortOrder-relative order (chip order); the
  // rest, in sortOrder-relative order by default, or re-derived for display
  // when sorted/grouped - see RestZone. Either way this is the sequence fed
  // to dnd-kit, so a drag's before/after indices always match what's shown.
  const featuredItems = useMemo(() => items.filter((r) => r.featured), [items]);
  const restItemsBase = useMemo(() => items.filter((r) => !r.featured), [items]);
  const restItemsDisplay = useMemo(() => {
    if (sortMode !== "name") return restItemsBase;
    return [...restItemsBase].sort((a, b) => a.name.localeCompare(b.name));
  }, [restItemsBase, sortMode]);

  const allRow = (id: string) => items.find((r) => r._id === id) || null;
  const zoneOf = (id: string): "featured" | "rest" | null => {
    if (id === "featured" || id === "rest") return id;
    if (featuredItems.some((r) => r._id === id)) return "featured";
    if (restItemsDisplay.some((r) => r._id === id)) return "rest";
    return null;
  };

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

  const activeRow = activeId ? allRow(activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const fromZone = zoneOf(String(active.id));
    const toZone = zoneOf(String(over.id));
    if (!fromZone || !toZone) return;

    const featuredIds = featuredItems.map((r) => r._id);
    const restIds = restItemsDisplay.map((r) => r._id);
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (fromZone === toZone) {
      if (active.id === over.id) return;
      if (fromZone === "rest" && sortMode !== "order") return; // display order isn't the real order here - dragging is disabled in the UI, guard anyway
      const list = fromZone === "featured" ? featuredIds : restIds;
      const oldIndex = list.indexOf(activeIdStr);
      const newIndex = list.indexOf(overIdStr);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(list, oldIndex, newIndex);
      const fullOrder = fromZone === "featured" ? [...reordered, ...restIds] : [...featuredIds, ...reordered];
      onReorder(fullOrder);
      return;
    }

    // Crossed zones - pull the item out of its old list, drop it into the
    // new one at the target position (or the end, if dropped on the empty
    // container itself rather than a specific row), and flip `featured`.
    const sourceList = fromZone === "featured" ? [...featuredIds] : [...restIds];
    const destList = toZone === "featured" ? [...featuredIds] : [...restIds];
    const sourceIndex = sourceList.indexOf(activeIdStr);
    if (sourceIndex === -1) return;
    sourceList.splice(sourceIndex, 1);
    const destIndex = destList.indexOf(overIdStr);
    destList.splice(destIndex === -1 ? destList.length : destIndex, 0, activeIdStr);

    const newFeatured = toZone === "featured" ? destList : sourceList;
    const newRest = toZone === "featured" ? sourceList : destList;
    onReorder([...newFeatured, ...newRest]);
    const row = allRow(activeIdStr);
    if (row) onSetFeatured(row, toZone === "featured");
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <FeaturedZone items={featuredItems} onToggleActive={onToggleActive} onDelete={onDelete} />

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Everything else</p>
          <div className="flex items-center gap-2">
            <SegmentedControl
              value={sortMode}
              onChange={setSortMode}
              options={[{ value: "order", label: "Custom order" }, { value: "name", label: "Name" }]}
            />
            <SegmentedControl
              value={groupMode}
              onChange={setGroupMode}
              options={[{ value: "none", label: "No groups" }, { value: "category", label: "By category" }]}
            />
          </div>
        </div>
        {sortMode === "name" && (
          <p className="text-xs text-fg-quaternary -mt-2">Sorted by name - switch to Custom order to drag within this list (dragging into Featured above still works).</p>
        )}

        <RestZone items={restItemsDisplay} sortMode={sortMode} groupMode={groupMode} onToggleActive={onToggleActive} onDelete={onDelete} />

        <DragOverlay>
          {activeRow ? <RowContent row={activeRow} onToggleActive={onToggleActive} onDelete={onDelete} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
