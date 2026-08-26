/* ─── Validation helpers (shared by every admin form) ────────────── */
export const validators: Record<string, (v: string) => string | null> = {
  email: (v) => (!v?.trim() ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email address" : null),
  phone: (v) => (v && !/^\+?[\d\s\-().]{7,}$/.test(v) ? "Invalid phone number" : null),
  googleReviewUrl: (v) => (v && !v.startsWith("http") ? "Must be a valid URL starting with http" : null),
  website: (v) => (v && !v.startsWith("http") ? "Must be a valid URL starting with http" : null),
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

export function validate(fields: string[], form: Record<string, string>): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const fn = validators[f];
    if (!fn) {
      if (!form[f]?.trim() && ["name", "serial", "code", "reviewText", "businessId"].includes(f)) {
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
  businessId: "Business ID",
  reviewText: "Review Text",
  status: "Status",
};

export const REQUIRED_FIELDS: Record<string, boolean> = {
  name: true, serial: true, code: true, reviewText: true, businessId: true, email: true,
};
