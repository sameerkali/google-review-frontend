"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { buildDraft, type Aspect } from "@/lib/buildDraft";
import { AlertIcon, CloseIcon, SearchIcon, StarFillIcon, StarIcon } from "@/components/icons";
import { Spinner } from "@/components/Loaders";
import { ThemeToggle } from "@/components/ThemeToggle";

type MenuItem = { id: string; name: string; category: string | null };
type SessionData = { token: string; business: { name: string; logoUrl: string | null; googleReviewUrl: string | null } };

type Step = "items" | "rating" | "aspects" | "review";
const STEPS: Step[] = ["items", "rating", "aspects", "review"];

const ASPECTS: { key: Aspect; label: string }[] = [
  { key: "staff", label: "Staff" },
  { key: "speed", label: "Speed" },
  { key: "taste", label: "Taste" },
  { key: "portion", label: "Portion" },
  { key: "price", label: "Price" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "ambience", label: "Ambience" },
  { key: "music", label: "Music" },
];

const VISIBLE_ITEM_COUNT = 8;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer ${
        active
          ? "bg-brand/15 text-brand border-brand/30"
          : "bg-surface text-fg-secondary border-border hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}

function ScreenShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6 animate-rise-in">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl font-semibold text-fg">{title}</h1>
        {subtitle && <p className="text-sm text-fg-tertiary">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [step, setStep] = useState<Step>("items");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [freeTextItem, setFreeTextItem] = useState("");
  const [rating, setRating] = useState(0);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [draftText, setDraftText] = useState("");
  const [originalDraft, setOriginalDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const reviewTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Created once per page load - never refetched (a refetch would mint a
  // second, throwaway session), matches the 24-char sessionToken contract
  // in the plan's data model.
  const { data: session, isPending: sessionPending, isError: sessionError, error: sessionErrorObj } = useQuery({
    queryKey: ["public", "feedback", "session", code],
    queryFn: () => api<SessionData>("/api/v1/feedback/session", { method: "POST", body: { code } }),
    enabled: !!code,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    meta: { silent: true },
  });
  const token = session?.token;

  const { data: menuItems = [], isPending: menuPending } = useQuery({
    queryKey: ["public", "feedback", "menu", token],
    queryFn: () => api<MenuItem[]>(`/api/v1/feedback/${token}/menu`),
    enabled: !!token,
    staleTime: Infinity,
    meta: { silent: true },
  });

  // A short debounce so the chip grid re-filters a beat after typing stops
  // instead of on every keystroke - the actual cause of the list "shivering"
  // wasn't missing animation, it was re-laying-out on every character.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(itemSearch), 150);
    return () => clearTimeout(t);
  }, [itemSearch]);

  // Menu items already arrive sorted by sortOrder from the backend, so the
  // top VISIBLE_ITEM_COUNT (with no search typed) is whatever the business
  // dragged to the front - its bestsellers, not an arbitrary DB-insertion
  // order. Selected items stay in this same list and are just highlighted,
  // never pulled out into a separate section.
  const visibleItems = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const list = term ? menuItems.filter((m) => m.name.toLowerCase().includes(term)) : menuItems;
    return list.slice(0, term ? list.length : VISIBLE_ITEM_COUNT);
  }, [menuItems, debouncedSearch]);
  const hasExactMatch = useMemo(
    () => menuItems.some((m) => m.name.toLowerCase() === debouncedSearch.trim().toLowerCase()),
    [menuItems, debouncedSearch]
  );

  const toggleItem = (id: string) =>
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAspect = (a: Aspect) =>
    setAspects((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const patchSession = (body: Record<string, unknown>) => {
    if (!token) return;
    void api(`/api/v1/feedback/${token}`, { method: "PATCH", body });
  };

  const goToRating = () => {
    patchSession({ menuItemIds: selectedItemIds, freeTextItem: freeTextItem.trim() });
    setStep("rating");
  };

  const selectRating = (n: number) => {
    setRating(n);
    patchSession({ rating: n });
    setStep("aspects");
  };

  const goToReview = () => {
    patchSession({ aspects });
    const selectedNames = menuItems.filter((m) => selectedItemIds.includes(m.id)).map((m) => m.name);
    const items = selectedNames.length ? selectedNames : freeTextItem.trim() ? [freeTextItem.trim()] : [];
    // Seed defaults to Math.random() inside buildDraft - safe here since this
    // runs in a click handler, not during render.
    const draft = buildDraft({ rating, items, aspects });
    setDraftText(draft);
    setOriginalDraft(draft);
    if (token) void api(`/api/v1/feedback/${token}/draft`, { method: "POST", body: { draftGenerated: draft } });
    setStep("review");
  };

  useEffect(() => {
    if (step === "review") reviewTextareaRef.current?.focus();
  }, [step]);

  // Synchronous, inside the tap - no `await` between the tap and the
  // clipboard write, or iOS Safari silently drops it (see plan section 3.5).
  const handleCopyAndGo = () => {
    setGoogleError("");
    const text = draftText;
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (token) {
      void api(`/api/v1/feedback/${token}/copied`, {
        method: "POST",
        keepalive: true,
        body: { edited: text.trim() !== originalDraft.trim(), length: text.length },
      });
    }

    let url = session?.business.googleReviewUrl?.trim();
    if (!url) {
      setGoogleError("No Google Review URL has been set for this business.");
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try {
      new URL(url);
    } catch {
      setGoogleError("The Google Review URL saved for this business is invalid. Please ask the business owner to update it.");
      return;
    }

    if (token) void api(`/api/v1/feedback/${token}/clicked`, { method: "POST", keepalive: true });
    window.location.href = url;
  };

  if (sessionPending) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background relative">
        <ThemeToggle className="fixed top-4 right-4" />
        <Spinner size="md" />
      </div>
    );
  }

  if (sessionError || !session) {
    // An ApiError means the server responded (e.g. a real 404 for an unknown
    // code); anything else means the request never got a response at all -
    // wrong API URL, backend not running, no network. Those need a different
    // fix than "the code is wrong," so don't show the same message for both.
    const unreachable = !(sessionErrorObj instanceof ApiError);
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6 relative">
        <ThemeToggle className="fixed top-4 right-4" />
        <div className="text-center space-y-3 animate-rise-in">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-1">
            <AlertIcon className="w-6 h-6 text-danger" />
          </div>
          <p className="text-fg-secondary text-lg font-medium">{unreachable ? "Can't Reach the Server" : "QR Code Not Found"}</p>
          <p className="text-fg-tertiary text-sm max-w-xs">
            {unreachable
              ? "The review service isn't responding right now. If you're testing locally, make sure the backend is running and reachable at the configured API URL."
              : "This QR code is not recognised. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const { business } = session;
  const stepIndex = STEPS.indexOf(step);

  return (
    // items-center + justify-start (not justify-center) - a centered
    // column re-centers itself, and jumps, every time the on-screen
    // keyboard resizes the visual viewport. Anchoring from the top means
    // opening the keyboard just crops the bottom instead of moving anything.
    <div className="min-h-dvh flex flex-col items-center p-6 pt-10 sm:pt-16 relative bg-background">
      <ThemeToggle className="fixed top-4 right-4" />

      <div className="w-full max-w-sm space-y-6">
        {/* Business identity + progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-fg-tertiary">{initials(business.name)}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-fg">{business.name}</p>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-brand" : "bg-surface-inset"}`} />
            ))}
          </div>
        </div>

        {/* Screen 1 - What did you have? */}
        {step === "items" && (
          <ScreenShell title="What did you have?" subtitle="Pick what you remember - or skip this.">
            {menuPending ? (
              <div className="flex justify-center py-8"><Spinner size="md" /></div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <SearchIcon className="w-4 h-4 text-fg-quaternary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const term = itemSearch.trim();
                      if (!term) return;
                      const exact = menuItems.find((m) => m.name.toLowerCase() === term.toLowerCase());
                      if (exact) toggleItem(exact.id);
                      else setFreeTextItem(term);
                      setItemSearch("");
                    }}
                    placeholder="Search the menu or type your own…"
                    className="w-full rounded-xl border border-border bg-surface pl-10 pr-3 py-2.5 text-sm text-fg placeholder:text-fg-quaternary outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-center min-h-11 transition-[min-height] duration-200 ease-out">
                  {visibleItems.map((m) => (
                    <Chip key={m.id} active={selectedItemIds.includes(m.id)} onClick={() => toggleItem(m.id)}>
                      {m.name}
                    </Chip>
                  ))}
                  {freeTextItem.trim() && (
                    <Chip active onClick={() => setFreeTextItem("")}>
                      <span className="inline-flex items-center gap-1.5">
                        {freeTextItem.trim()}
                        <CloseIcon className="w-3 h-3" />
                      </span>
                    </Chip>
                  )}
                  {debouncedSearch.trim() && !hasExactMatch && (
                    <Chip active={false} onClick={() => { setFreeTextItem(debouncedSearch.trim()); setItemSearch(""); }}>
                      + Add &quot;{debouncedSearch.trim()}&quot;
                    </Chip>
                  )}
                  {!visibleItems.length && !freeTextItem.trim() && !debouncedSearch.trim() && (
                    <p className="text-sm text-fg-quaternary py-2">No menu items yet - your own words work too.</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button onClick={goToRating} className="text-sm font-medium text-fg-tertiary hover:text-fg transition-colors cursor-pointer">
                    Skip
                  </button>
                  <button
                    onClick={goToRating}
                    className="rounded-full bg-brand hover:bg-brand-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </ScreenShell>
        )}

        {/* Screen 2 - How was it? One tap advances, no branching. */}
        {step === "rating" && (
          <ScreenShell title="How was it?">
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => selectRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="p-1.5 cursor-pointer active:scale-90 transition-transform duration-100"
                >
                  {n <= rating ? (
                    <StarFillIcon className="w-9 h-9 text-warning" />
                  ) : (
                    <StarIcon className="w-9 h-9 text-fg-quaternary" />
                  )}
                </button>
              ))}
            </div>
          </ScreenShell>
        )}

        {/* Screen 3 - Anything stand out? */}
        {step === "aspects" && (
          <ScreenShell title="Anything stand out?" subtitle="Pick what applies - or skip this.">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {ASPECTS.map((a) => (
                  <Chip key={a.key} active={aspects.includes(a.key)} onClick={() => toggleAspect(a.key)}>
                    {a.label}
                  </Chip>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <button onClick={goToReview} className="text-sm font-medium text-fg-tertiary hover:text-fg transition-colors cursor-pointer">
                  Skip
                </button>
                <button
                  onClick={goToReview}
                  className="rounded-full bg-brand hover:bg-brand-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </ScreenShell>
        )}

        {/* Screen 4 - Your review. Same button at every rating, no branching. */}
        {step === "review" && (
          <ScreenShell title="Your review">
            <div className="space-y-3">
              <p className="text-xs text-fg-tertiary">Edit this however you like. It is your review.</p>
              <textarea
                ref={reviewTextareaRef}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={draftText.length > 220 ? 8 : draftText.length > 120 ? 6 : 5}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm text-fg leading-relaxed outline-none focus:border-brand/50 transition-[height,border-color] duration-200 resize-none"
              />
              <button
                onClick={handleCopyAndGo}
                className="w-full rounded-full bg-brand hover:bg-brand-hover py-3.5 text-sm font-semibold text-white transition-colors duration-150 cursor-pointer active:scale-[0.98]"
              >
                {copied ? "Copied - opening Google…" : "Copy and open Google"}
              </button>
              {googleError && (
                <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger flex items-start gap-2">
                  <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  {googleError}
                </div>
              )}
            </div>
          </ScreenShell>
        )}

        <p className="text-center text-xs text-fg-quaternary">Powered by Expendifii</p>
      </div>
    </div>
  );
}
