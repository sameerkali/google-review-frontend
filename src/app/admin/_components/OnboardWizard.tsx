"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { validate } from "../_lib/validators";
import { AlertIcon, CheckIcon, CloseIcon, CopyIcon, PlusIcon } from "@/components/icons";
import { generatePassword } from "../_lib/generatePassword";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { QrCard } from "@/components/QrCard";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/Input";

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
  open, onClose, token, hardwareList, plans, toast,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  hardwareList: Row[];
  plans: Row[];
  toast: ToastFn;
}) {
  const queryClient = useQueryClient();
  const emptyDetails: Record<string, string> = { name: "", email: "", phone: "", address: "", googleReviewUrl: "" };
  const [step, setStep] = useState<WizardStep>("details");
  const [details, setDetails] = useState<Record<string, string>>(emptyDetails);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [detailTouched, setDetailTouched] = useState<Record<string, boolean>>({});
  const [planId, setPlanId] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  // The code field is either what the admin typed, or — until they touch it —
  // a suggestion derived from the business name. Derived at render time
  // (not synced via an effect) so there's nothing to keep in sync.
  const [codeInput, setCodeInput] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [reviews, setReviews] = useState<string[]>([""]);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{ businessName: string; reviewUrl: string; codeNotConfirmed?: boolean } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

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
    setPortalPassword("");
    setReviews([""]);
    setServerError("");
    setResult(null);
  };

  const onboardMutation = useMutation({
    mutationKey: ["admin", "businesses", "onboard"],
    mutationFn: async () => {
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
          password: portalPassword.trim() || undefined,
        },
      });

      // Review suggestions are best-effort follow-ups: a failure here must
      // not fail (or retry) the business that was just successfully created.
      const texts = reviews.map((r) => r.trim()).filter(Boolean);
      let failedReviewCount = 0;
      for (const reviewText of texts) {
        try {
          await api("/admin/review-suggestions", { method: "POST", token, body: { businessId: created._id, reviewText } });
        } catch {
          failedReviewCount++;
        }
      }
      return { business: created, failedReviewCount };
    },
    meta: { toastOnError: false }, // inline serverError banner below
    onSuccess: ({ business: created, failedReviewCount }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "hardware", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews", "businesses"] });

      if (failedReviewCount > 0) {
        toast("error", `Business created, but ${failedReviewCount} review suggestion${failedReviewCount > 1 ? "s" : ""} failed to save — add ${failedReviewCount > 1 ? "them" : "it"} again from the Reviews tab`);
      }

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
    },
    onError: (e) => {
      const msg: string = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      if (/email/i.test(msg)) {
        setStep("details");
        setDetailErrors((prev) => ({ ...prev, email: "This email is already registered to another business" }));
        setDetailTouched((prev) => ({ ...prev, email: true }));
      }
      setServerError(msg);
    },
  });

  useEscapeKey(onClose, open && !onboardMutation.isPending);

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

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);

  return (
    <Modal open={open} onClose={onboardMutation.isPending ? undefined : onClose} maxWidth="lg" labelledBy="wizard-title">
      <div className="max-h-[85vh] flex flex-col">
        {/* Header */}
        <ModalHeader onClose={onboardMutation.isPending ? undefined : onClose}>
          <h2 id="wizard-title" className="text-sm font-semibold text-fg">
            {step === "success" ? "Business Onboarded" : "Onboard New Business"}
          </h2>
          {step !== "success" && (
            <p className="text-xs text-fg-tertiary mt-0.5">
              Step {stepIndex + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[stepIndex].label}
            </p>
          )}
        </ModalHeader>

        {/* Progress bar */}
        {step !== "success" && (
          <div className="flex gap-1.5 px-6 pt-4 shrink-0">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-brand" : "bg-surface-inset"}`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {serverError && step !== "success" && (
            <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-start gap-2">
              <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              {DETAIL_FIELDS.map(({ f, label, required }, i) => (
                <Field key={f} label={`${label}${required ? " *" : ""}`} htmlFor={`wiz-${f}`} error={detailErrors[f]}>
                  <Input
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
                    error={!!detailErrors[f]}
                  />
                </Field>
              ))}
              <div>
                <Label htmlFor="wiz-plan">Plan</Label>
                <Select id="wiz-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  <option value="">— none yet —</option>
                  {plans.map((p) => <option key={p._id} value={p._id}>{p.name} · ₹{p.price}{p.billingType === "monthly" ? "/mo" : p.billingType === "annually" ? "/yr" : ""}</option>)}
                </Select>
                {!plans.length && (
                  <p className="mt-1.5 text-xs text-fg-quaternary">No plans set up yet — add one from the Plans tab, or leave this business unassigned for now.</p>
                )}
              </div>
              <div>
                <Label htmlFor="wiz-password">Business Portal Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="wiz-password"
                    type="text"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Leave blank to set up later"
                    className="flex-1 min-w-0 font-mono"
                  />
                  <Button type="button" variant="secondary" onClick={() => setPortalPassword(generatePassword())} className="shrink-0">
                    Generate
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-fg-quaternary">
                  Lets the business owner log into their own dashboard at /business/login to see their stats and manage reviews. You&apos;ll see this password once more on the next screen — share it with them.
                </p>
              </div>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-fg-tertiary">
                This code goes on the physical QR stand, table tent, or NFC tag for{" "}
                <span className="text-fg font-medium">{details.name || "this business"}</span>.
              </p>
              <div>
                <Label htmlFor="wiz-code">Hardware Serial / Code</Label>
                <Input
                  id="wiz-code"
                  autoFocus
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CAFE-DELHI"
                  className="font-mono"
                />
                <p className="mt-1.5 text-xs text-fg-quaternary">
                  {codeTouched
                    ? "Doesn't need to exist yet — it's set up automatically when you finish."
                    : "Suggested from the business name — edit it if you already have a physical code."}
                </p>
              </div>
              {availableHardware.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider mb-1.5">Or use unassigned hardware already in stock</p>
                  <div className="flex flex-wrap gap-2">
                    {availableHardware.map((h) => (
                      <button
                        key={h._id}
                        type="button"
                        onClick={() => setCode(h.serial)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                          code === h.serial
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border-strong text-fg-tertiary hover:border-fg-quaternary hover:text-fg"
                        }`}
                      >
                        {h.serial} <span className="text-fg-quaternary">· {h.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "reviews" && (
            <div className="space-y-4">
              <p className="text-sm text-fg-tertiary">
                Pre-written reviews shown to customers after they scan — optional, but they significantly increase conversion. You can add more later too.
              </p>
              {reviews.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Textarea
                    autoFocus={i === 0}
                    value={r}
                    onChange={(e) => updateReview(i, e.target.value)}
                    rows={2}
                    placeholder={`Suggestion ${i + 1}, e.g. "Great coffee and quick service!"`}
                    className="flex-1"
                  />
                  {reviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReview(i)}
                      aria-label={`Remove suggestion ${i + 1}`}
                      className="mt-1 rounded-lg p-2 text-fg-tertiary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
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
                  className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover transition-colors cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add another suggestion
                </button>
              )}
            </div>
          )}

          {step === "success" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-4 h-4 text-success" />
                </div>
                <p className="text-sm text-success">
                  <span className="font-semibold">{result.businessName}</span> is set up and ready to collect reviews
                  {planId && plans.find((p) => p._id === planId) ? <> on the <span className="font-semibold">{plans.find((p) => p._id === planId)?.name}</span> plan</> : "."}
                </p>
              </div>
              {portalPassword.trim() && (
                <div className="rounded-xl border border-info/20 bg-info/5 p-4 space-y-2">
                  <p className="text-xs font-medium text-info uppercase tracking-wider">Business Portal Login — share this now</p>
                  <p className="text-xs text-fg-tertiary">Shown once — it won&apos;t be displayed again after you close this.</p>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-background border border-border px-3 py-2 font-mono text-xs text-fg-secondary">
                    <span className="truncate">{details.email.trim()} · {portalPassword.trim()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(`${details.email.trim()} / ${portalPassword.trim()}`)
                          .then(() => { setCopiedCreds(true); toast("info", "Credentials copied"); setTimeout(() => setCopiedCreds(false), 2500); })
                          .catch(() => toast("error", "Could not copy to clipboard"));
                      }}
                      className="shrink-0 flex items-center gap-1 text-fg-tertiary hover:text-fg transition-colors cursor-pointer"
                    >
                      {copiedCreds ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
              {result.reviewUrl ? (
                <QrCard reviewUrl={result.reviewUrl} businessName={result.businessName} toast={toast} badgeLabel="Ready" compact />
              ) : result.codeNotConfirmed ? (
                <div role="alert" className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning flex items-start gap-2">
                  <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    The business was created, but the server didn&apos;t confirm the QR code was linked — it may be
                    running an older version. Open <strong>View QR</strong> on the Businesses tab to link it manually.
                  </span>
                </div>
              ) : (
                <p className="text-sm text-fg-tertiary">
                  No QR code was linked yet — assign hardware to this business anytime from the Businesses tab.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border shrink-0">
          {step === "details" && (
            <Button onClick={goToCode} variant="primary" className="ml-auto">
              Continue
            </Button>
          )}
          {step === "code" && (
            <>
              <Button onClick={() => setStep("details")} variant="secondary">Back</Button>
              <Button onClick={() => setStep("reviews")} variant="primary" className="ml-auto">Continue</Button>
            </>
          )}
          {step === "reviews" && (
            <>
              <Button onClick={() => setStep("code")} variant="secondary" disabled={onboardMutation.isPending}>Back</Button>
              <Button onClick={() => onboardMutation.mutate()} variant="primary" loading={onboardMutation.isPending} loadingText="Creating…" className="ml-auto">
                Finish &amp; Generate QR
              </Button>
            </>
          )}
          {step === "success" && (
            <>
              <Button onClick={resetAll} variant="secondary">Onboard Another</Button>
              <Button onClick={onClose} variant="primary" className="ml-auto">Done</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
