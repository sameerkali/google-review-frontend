// Deliberate escape hatch for genuinely dynamic admin data (DataTable,
// generic modals) - prefer a real interface below and pass it through
// Row's structural compatibility instead of widening this further.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

/* Real shapes for the entities the admin app fetches most often - a real
   interface is structurally assignable to `Row` (Record<string, any>), so
   tightening a fetch's generic type here is a no-risk change: everything
   downstream that still expects `Row`/`Row[]` (DataTable, ListTab, the edit
   modals) keeps compiling exactly as before, it just gets real field
   checking at the point the data actually enters the app. Deliberately not
   exhaustive - a field this doesn't know about still comes through fine,
   it's just untyped at that field, same as `Row` already was. */
export interface Business {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  website?: string;
  googleReviewUrl?: string;
  status: "active" | "suspended" | "expired";
  planId?: string | Plan | null;
  hardwareAssigned?: boolean;
  hardwareCreated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HardwareItem {
  _id: string;
  type: "QR" | "NFC";
  serial: string;
  status: "available" | "assigned" | "lost" | "damaged";
  assignedBusinessId?: string | Business | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Plan {
  _id: string;
  name: string;
  billingType: "monthly" | "annually" | "one_time";
  price: number;
  features?: {
    analytics?: "none" | "basic" | "full";
    userData?: boolean;
    suggestions?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  msg: string;
}

export type ToastFn = (kind: Toast["kind"], msg: string) => void;
