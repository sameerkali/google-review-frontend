/** Accepts a bare domain ("example.com") the same way the rest of the app
    does (see the auto-https-prefix in the review page's Google-click
    handler) but still rejects a value with no usable host at all, like
    "http://" or "http:example" - a plain `startsWith("http")` check let
    those through. Note this still isn't a strict check: a syntactically
    valid but meaningless single-label host like "httpfoo" passes too,
    since it's indistinguishable from a real one-word intranet hostname to
    a URL parser - this is a step up from the old check, not a guarantee
    the value resolves to anything real. */
function isValidUrl(v: string): boolean {
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    new URL(withScheme);
    return true;
  } catch {
    return false;
  }
}

/* ─── Validation helpers (shared by every admin form) ────────────── */
export const validators: Record<string, (v: string) => string | null> = {
  email: (v) => (!v?.trim() ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email address" : null),
  phone: (v) => (v && !/^\d{10}$/.test(v) ? "Phone number must be exactly 10 digits" : null),
  password: (v) => (v && (v.length < 4 || v.length > 14) ? "Password must be 4–14 characters" : null),
  googleReviewUrl: (v) => (v && !isValidUrl(v) ? "Must be a valid URL" : null),
  website: (v) => (v && !isValidUrl(v) ? "Must be a valid URL" : null),
  price: (v) => (v && isNaN(Number(v)) ? "Must be a number" : null),
  name: (v) => (!v?.trim() ? "Name is required" : null),
  serial: (v) => (!v?.trim() ? "Serial / Code is required" : null),
  code: (v) => (!v?.trim() ? "QR Code is required" : null),
  billingType: (v) => (!["monthly", "annually", "one_time"].includes(v) ? 'Use "monthly", "annually", or "one_time"' : null),
  type: (v) => (!["QR", "NFC"].includes(v) ? 'Use "QR" or "NFC"' : null),
  status: () => null,
};

/* ─── Fields rendered as a <select> instead of free text ─────────── */
export const FIELD_OPTIONS: Record<string, string[]> = {
  type: ["QR", "NFC"],
  billingType: ["monthly", "annually", "one_time"],
};

export const HARDWARE_STATUS_OPTIONS = ["available", "assigned", "lost", "damaged"];
export const BUSINESS_STATUS_OPTIONS = ["active", "suspended", "expired"];

/** The event `type` values the backend's analytics endpoint groups by -
    shared so Overview and Analytics can't independently typo/diverge on
    which keys exist, even though each renders them with different copy. */
export const EVENT_TYPES = ["scan", "google_click", "review_copy"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Strips everything but digits and caps at 10 - used on every phone
    input's onChange so it's physically impossible to type past the limit
    or enter a non-digit, not just flagged after the fact. */
export const sanitizePhone = (v: string): string => v.replace(/\D/g, "").slice(0, 10);

export function validate(fields: string[], form: Record<string, string>): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const fn = validators[f];
    if (!fn) {
      if (!form[f]?.trim() && ["name", "serial", "code"].includes(f)) {
        errs[f] = `${f} is required`;
      }
      continue;
    }
    const msg = fn(form[f] || "");
    if (msg) errs[f] = msg;
  }
  return errs;
}

export const FIELD_LABELS: Record<string, string> = {
  name: "Business Name",
  email: "Email Address",
  phone: "Phone Number",
  address: "Address",
  city: "City",
  website: "Website",
  googleReviewUrl: "Google Review URL",
  code: "Hardware Serial / Code",
  billingType: "Billing Type",
  price: "Price",
  type: "Hardware Type",
  serial: "Serial Number",
  status: "Status",
};

export const REQUIRED_FIELDS: Record<string, boolean> = {
  name: true, serial: true, code: true, email: true,
};
