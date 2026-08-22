"use client";

import { use, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertIcon, CheckIcon, CopyIcon } from "@/components/icons";
import { Spinner } from "@/components/Loaders";
import { ThemeToggle } from "@/components/ThemeToggle";

type Suggestion = { id: string; text: string };
type BizData = {
  business: { name: string; logoUrl?: string; googleReviewUrl: string };
  suggestions: Suggestion[];
  hardware: { code: string };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [googleUrlError, setGoogleUrlError] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: ["public", "review", code],
    queryFn: () => api<BizData>(`/r/${code}`),
    refetchOnWindowFocus: false,
    meta: { silent: true }, // rendered inline below, not a toast
  });
  const loading = isPending;
  const error = isError ? "This QR code is not recognised. Please try again." : "";

  // Fire the scan beacon once per successful load of a given code — not on
  // every background refetch (e.g. reconnect) of the same query.
  const analyticsSent = useRef<string | null>(null);
  useEffect(() => {
    if (!data || analyticsSent.current === code) return;
    analyticsSent.current = code;
    void api("/analytics", { method: "POST", body: { code } });
  }, [data, code]);

  const handleCopy = async (s: Suggestion) => {
    await navigator.clipboard.writeText(s.text);
    setCopiedId(s.id);
    void api("/copy", { method: "POST", body: { code } });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGoogle = () => {
    setGoogleUrlError("");
    let url = data?.business.googleReviewUrl?.trim();
    if (!url) {
      setGoogleUrlError("No Google Review URL has been set for this business.");
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try { new URL(url); } catch {
      setGoogleUrlError("The Google Review URL saved for this business is invalid. Please ask the business owner to update it.");
      return;
    }
    void api("/open-google", { method: "POST", body: { code } });
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background relative">
        <ThemeToggle className="fixed top-4 right-4" />
        <Spinner size="md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6 relative">
        <ThemeToggle className="fixed top-4 right-4" />
        <div className="text-center space-y-3 animate-rise-in">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-1">
            <AlertIcon className="w-6 h-6 text-danger" />
          </div>
          <p className="text-fg-secondary text-lg font-medium">QR Code Not Found</p>
          <p className="text-fg-tertiary text-sm max-w-xs">{error}</p>
        </div>
      </div>
    );
  }

  const { business, suggestions } = data;

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-6 relative">
      <ThemeToggle className="fixed top-4 right-4" />

      <div className="w-full max-w-sm space-y-4">

        {/* Business identity — logo/initials avatar + name */}
        <div className="rounded-2xl border border-border bg-surface px-6 py-7 text-center space-y-3 animate-rise-in">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-16 h-16 rounded-2xl object-cover mx-auto border border-border-strong shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto">
              <span className="text-lg font-semibold text-brand">{initials(business.name)}</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-fg">{business.name}</h1>
            <p className="text-sm text-fg-tertiary mt-1">We&apos;d love your feedback!</p>
          </div>
        </div>

        {/* All reviews in one box, one row each with inline copy button */}
        {suggestions.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden animate-rise-in" style={{ animationDelay: "60ms" }}>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-fg-tertiary uppercase tracking-widest font-medium">Suggested reviews</p>
            </div>
            {suggestions.map((s, i) => {
              const isCopied = copiedId === s.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-4 py-4${
                    i < suggestions.length - 1 ? " border-b border-border" : ""
                  }`}
                >
                  <p className="flex-1 text-fg-secondary text-sm leading-relaxed min-w-0">{s.text}</p>
                  <button
                    onClick={() => handleCopy(s)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 border ${
                      isCopied
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-border-strong text-fg-tertiary hover:border-brand hover:text-brand"
                    }`}
                  >
                    {isCopied ? (
                      <><CheckIcon className="w-3.5 h-3.5" /> Copied</>
                    ) : (
                      <><CopyIcon className="w-3.5 h-3.5" /> Copy</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Google Review CTA */}
        <button
          onClick={handleGoogle}
          className="w-full rounded-2xl bg-brand py-4 text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-brand-hover active:scale-95 transition-all shadow-lg shadow-brand/20 cursor-pointer animate-rise-in"
          style={{ animationDelay: "120ms" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Leave a Google Review
        </button>

        {googleUrlError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-start gap-2">
            <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {googleUrlError}
          </div>
        )}

        <p className="text-center text-xs text-fg-quaternary">Powered by QR Expendifii.com</p>
      </div>
    </div>
  );
}
