"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { validate } from "../_lib/validators";
import { AlertIcon, CheckIcon, CloseIcon, PlusIcon } from "../_lib/icons";
import { useEscapeKey } from "../_lib/useEscapeKey";
import { Spinner } from "./Loaders";
import { QrCard } from "./QrCard";

/* ─── Onboarding Wizard ──────────────────────────────────────────────
   Single guided flow that replaces the old "register hardware, then
   business, then hunt for its ID to add reviews" 3-tab process: business
   details → QR code → review suggestions → the QR is generated immediately. */
type WizardStep = "details" | "code" | "reviews" | "success";

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "code", label: "QR Code" },
  { key: "reviews", label: "Reviews" },
];

const DETAIL_FIELDS: { f: string; label: string; required?: boolean }[] = [
  { f: "name", label: "Business Name", required: true },
  { f: "email", label: "Email Address", required: true },
  { f: "phone", label: "Phone Number" },
  { f: "address", label: "Address" },
  { f: "googleReviewUrl", label: "Google Review URL" },
];

function slugifyCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return base || "BUSINESS";
}

export function OnboardWizard({
  open, onClose, token, hardwareList, plans, onRefresh, toast,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  hardwareList: Row[];
  plans: Row[];
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const emptyDetails: Record<string, string> = { name: "", email: "", phone: "", address: "", googleReviewUrl: "" };
  const [step, setStep] = useState<WizardStep>("details");
  const [details, setDetails] = useState<Record<string, string>>(emptyDetails);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [detailTouched, setDetailTouched] = useState<Record<string, boolean>>({});
  const [planId, setPlanId] = useState("");
  // The code field is either what the admin typed, or — until they touch it —
  // a suggestion derived from the business name. Derived at render time
  // (not synced via an effect) so there's nothing to keep in sync.
  const [codeInput, setCodeInput] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [reviews, setReviews] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{ businessName: string; reviewUrl: string; codeNotConfirmed?: boolean } | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const availableHardware = hardwareList.filter((h) => h.status === "available").slice(0, 6);

  const suggestedCode = (() => {
    if (!details.name.trim()) return "";
    const base = slugifyCode(details.name);
    const existing = new Set(hardwareList.map((h) => h.serial));
    let candidate = base;
    let n = 2;
    while (existing.has(candidate)) { candidate = `${base}-${n}`; n++; }
    return candidate;
  })();
  const code = codeTouched ? codeInput : suggestedCode;

  const setCode = (v: string) => { setCodeInput(v); setCodeTouched(true); };

  const resetAll = () => {
    setStep("details");
    setDetails(emptyDetails);
    setDetailErrors({});
    setDetailTouched({});
    setCodeInput("");
    setCodeTouched(false);
    setPlanId("");
    setReviews([""]);
    setServerError("");
    setResult(null);
  };

  useEscapeKey(onClose, open && !submitting);

  if (!open) return null;

  const detailFieldNames = DETAIL_FIELDS.map((d) => d.f);

  const validateDetailField = (f: string, values: Record<string, string>) => {
    const errs = validate([f], values);
    setDetailErrors((prev) => ({ ...prev, [f]: errs[f] || "" }));
  };

  const goToCode = () => {
    const errs = validate(detailFieldNames, details);
    setDetailErrors(errs);
    setDetailTouched(Object.fromEntries(detailFieldNames.map((f) => [f, true])));
    if (Object.values(errs).some(Boolean)) return;
    setServerError("");
    setStep("code");
  };

  const addReview = () => setReviews((r) => (r.length >= 5 ? r : [...r, ""]));
  const removeReview = (i: number) => setReviews((r) => r.filter((_, idx) => idx !== i));
  const updateReview = (i: number, v: string) => setReviews((r) => r.map((x, idx) => (idx === i ? v : x)));

  const finish = async () => {
    setSubmitting(true);
    setServerError("");
    try {
      const created = await api<Row>("/admin/business", {
        method: "POST",
        token,
        body: {
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim() || undefined,
          address: details.address.trim() || undefined,
          googleReviewUrl: details.googleReviewUrl.trim() || undefined,
          serial: code.trim() || undefined,
          planId: planId || undefined,
        },
      });

      const texts = reviews.map((r) => r.trim()).filter(Boolean);
      let failedReviews = 0;
      for (const reviewText of texts) {
        try {
          await api("/admin/review-suggestions", { method: "POST", token, body: { businessId: created._id, reviewText } });
        } catch {
          failedReviews++;
        }
      }
      if (failedReviews > 0) {
        toast("error", `Business created, but ${failedReviews} review suggestion${failedReviews > 1 ? "s" : ""} failed to save — add ${failedReviews > 1 ? "them" : "it"} again from the Reviews tab`);
      }

      await onRefresh();
      // Don't celebrate a QR that isn't actually live — only show it once the
      // server confirms the code was assigned or created, not just because a
      // code was typed (e.g. an out-of-date backend can silently no-op this).
      const trimmedCode = code.trim();
      const linkConfirmed = Boolean(created.hardwareAssigned || created.hardwareCreated);
      setResult({
        businessName: created.name,
        reviewUrl: trimmedCode && linkConfirmed ? `${baseUrl}/r/${encodeURIComponent(trimmedCode)}` : "",
        codeNotConfirmed: Boolean(trimmedCode) && !linkConfirmed,
      });
      setStep("success");
    } catch (e) {
      const msg: string = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      if (/email/i.test(msg)) {
        setStep("details");
        setDetailErrors((prev) => ({ ...prev, email: "This email is already registered to another business" }));
        setDetailTouched((prev) => ({ ...prev, email: true }));
      }
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 id="wizard-title" className="text-sm font-semibold text-white">
              {step === "success" ? "Business Onboarded" : "Onboard New Business"}
            </h2>
            {step !== "success" && (
              <p className="text-xs text-zinc-500 mt-0.5">
                Step {stepIndex + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[stepIndex].label}
              </p>
            )}
          </div>
          <button
            onClick={() => !submitting && onClose()}
            aria-label="Close onboarding wizard"
            disabled={submitting}
            className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        {step !== "success" && (
          <div className="flex gap-1.5 px-6 pt-4 shrink-0">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-emerald-500" : "bg-zinc-800"}`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {serverError && step !== "success" && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
              <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              {DETAIL_FIELDS.map(({ f, label, required }, i) => (
                <div key={f} className="space-y-1.5">
                  <label htmlFor={`wiz-${f}`} className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {label}{required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    id={`wiz-${f}`}
                    autoFocus={i === 0}
                    type={f === "email" ? "email" : "text"}
                    value={details[f]}
                    onChange={(e) => {
                      const next = { ...details, [f]: e.target.value };
                      setDetails(next);
                      if (detailTouched[f]) validateDetailField(f, next);
                    }}
                    onBlur={() => { setDetailTouched((t) => ({ ...t, [f]: true })); validateDetailField(f, details); }}
                    aria-invalid={!!detailErrors[f]}
                    placeholder={f === "googleReviewUrl" ? "https://maps.google.com/..." : label}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                      detailErrors[f]
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                    }`}
                  />
                  {detailErrors[f] && <p role="alert" className="text-xs text-red-400">{detailErrors[f]}</p>}
                </div>
              ))}
              <div className="space-y-1.5">
                <label htmlFor="wiz-plan" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Plan
                </label>
                <select
                  id="wiz-plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                >
                  <option value="">— none yet —</option>
                  {plans.map((p) => <option key={p._id} value={p._id}>{p.name} · ₹{p.price}{p.billingType === "monthly" ? "/mo" : p.billingType === "annually" ? "/yr" : ""}</option>)}
                </select>
                {!plans.length && (
                  <p className="text-xs text-zinc-600">No plans set up yet — add one from the Plans tab, or leave this business unassigned for now.</p>
                )}
              </div>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                This code goes on the physical QR stand, table tent, or NFC tag for{" "}
                <span className="text-white font-medium">{details.name || "this business"}</span>.
              </p>
              <div className="space-y-1.5">
                <label htmlFor="wiz-code" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Hardware Serial / Code
                </label>
                <input
                  id="wiz-code"
                  autoFocus
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CAFE-DELHI"
                  className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15 font-mono"
                />
                <p className="text-xs text-zinc-600">
                  {codeTouched
                    ? "Doesn't need to exist yet — it's set up automatically when you finish."
                    : "Suggested from the business name — edit it if you already have a physical code."}
                </p>
              </div>
              {availableHardware.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Or use unassigned hardware already in stock</p>
                  <div className="flex flex-wrap gap-2">
                    {availableHardware.map((h) => (
                      <button
                        key={h._id}
                        type="button"
                        onClick={() => setCode(h.serial)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                          code === h.serial
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                        }`}
                      >
                        {h.serial} <span className="text-zinc-600">· {h.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "reviews" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Pre-written reviews shown to customers after they scan — optional, but they significantly increase conversion. You can add more later too.
              </p>
              {reviews.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    autoFocus={i === 0}
                    value={r}
                    onChange={(e) => updateReview(i, e.target.value)}
                    rows={2}
                    placeholder={`Suggestion ${i + 1}, e.g. "Great coffee and quick service!"`}
                    className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15 resize-none"
                  />
                  {reviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReview(i)}
                      aria-label={`Remove suggestion ${i + 1}`}
                      className="mt-1 rounded-lg p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {reviews.length < 5 && (
                <button
                  type="button"
                  onClick={addReview}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Add another suggestion
                </button>
              )}
            </div>
          )}

          {step === "success" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-sm text-emerald-300">
                  <span className="font-semibold">{result.businessName}</span> is set up and ready to collect reviews
                  {planId && plans.find((p) => p._id === planId) ? <> on the <span className="font-semibold">{plans.find((p) => p._id === planId)?.name}</span> plan</> : "."}
                </p>
              </div>
              {result.reviewUrl ? (
                <QrCard reviewUrl={result.reviewUrl} businessName={result.businessName} toast={toast} badgeLabel="Ready" compact />
              ) : result.codeNotConfirmed ? (
                <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-start gap-2">
                  <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    The business was created, but the server didn&apos;t confirm the QR code was linked — it may be
                    running an older version. Open <strong>View QR</strong> on the Businesses tab to link it manually.
                  </span>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  No QR code was linked yet — assign hardware to this business anytime from the Businesses tab.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
          {step === "details" && (
            <button
              onClick={goToCode}
              className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
            >
              Continue
            </button>
          )}
          {step === "code" && (
            <>
              <button
                onClick={() => setStep("details")}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep("reviews")}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
              >
                Continue
              </button>
            </>
          )}
          {step === "reviews" && (
            <>
              <button
                onClick={() => setStep("code")}
                disabled={submitting}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={finish}
                disabled={submitting}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? <><Spinner /> Creating…</> : "Finish & Generate QR"}
              </button>
            </>
          )}
          {step === "success" && (
            <>
              <button
                onClick={resetAll}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
              >
                Onboard Another
              </button>
              <button
                onClick={onClose}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
