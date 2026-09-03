import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Row } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** A Mongoose ref (e.g. businessId, planId, assignedBusinessId) arrives
    populated (a full object) or not (a bare id) depending on the endpoint -
    this reads whichever shape it's in without every call site duplicating
    the same `typeof x === "object"` check. */
export function populatedId(ref: unknown): unknown {
  return ref && typeof ref === "object" ? (ref as Row)._id : ref;
}

/** Same idea, for reading a populated ref's display name - falls back to
    the same "—" placeholder used everywhere else for missing data when the
    ref is bare (unpopulated) or absent. */
export function populatedName(ref: unknown): string {
  return ref && typeof ref === "object" ? ((ref as Row).name ?? "—") : "—";
}

/** Whether any row in `hardwareList` has `assignedBusinessId` pointing at `business`. */
export function hasLinkedHardware(business: Row, hardwareList: Row[]): boolean {
  return hardwareList.some((h) => populatedId(h.assignedBusinessId) === business._id);
}

/** The hardware (if any) currently assigned to `business`. */
export function hardwareForBusiness(business: Row, hardwareList: Row[]): Row | undefined {
  return hardwareList.find((h) => populatedId(h.assignedBusinessId) === business._id);
}

/** Every modal in the app disables its own close button/backdrop-click
    while a save is in flight, via the same `pending ? undefined : onClose`
    ternary repeated at both the Modal and ModalHeader call sites - naming
    it means there's one place to get that guard right. */
export function guardedClose(onClose: () => void, busy: boolean): (() => void) | undefined {
  return busy ? undefined : onClose;
}

/** Lowercases, strips anything but alphanumerics to dashes, and trims
    leading/trailing dashes - safe for a downloaded filename on every OS.
    Falls back to "business" so a name that's entirely punctuation/emoji
    doesn't produce an empty or dash-only filename. */
export function slugifyForFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "business";
}
