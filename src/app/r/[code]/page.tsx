"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Suggestion = { id: string; text: string };
type BizData = {
  business: { name: string; logoUrl?: string; googleReviewUrl: string };
  suggestions: Suggestion[];
  hardware: { code: string };
};

export default function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const [code, setCode] = useState("");
  const [data, setData] = useState<BizData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [googleUrlError, setGoogleUrlError] = useState("");

  useEffect(() => {
    params.then(({ code: c }) => {
      setCode(c);
      load(c);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async (c: string) => {
    try {
      const result = await api<BizData>(`/r/${c}`);
      setData(result);
      void api("/analytics", { method: "POST", body: { code: c } });
    } catch {
      setError("This QR code is not recognised. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="text-center space-y-3">
          <p className="text-zinc-300 text-lg font-medium">QR Code Not Found</p>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { business, suggestions } = data;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">

        {/* Business card — name only */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-center">
          <h1 className="text-xl font-semibold text-zinc-100">{business.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">We&apos;d love your feedback!</p>
        </div>

        {/* All reviews in one box, one row each with inline copy button */}
        {suggestions.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Suggested reviews</p>
            </div>
            {suggestions.map((s, i) => {
              const isCopied = copiedId === s.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-4 py-4${
                    i < suggestions.length - 1 ? " border-b border-zinc-800" : ""
                  }`}
                >
                  <p className="flex-1 text-zinc-200 text-sm leading-relaxed min-w-0">{s.text}</p>
                  <button
                    onClick={() => handleCopy(s)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer border ${
                      isCopied
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400"
                    }`}
                  >
                    {isCopied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Google Review CTA */}
        <button
          onClick={handleGoogle}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-zinc-950 font-semibold text-base flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
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
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {googleUrlError}
          </div>
        )}

        <p className="text-center text-xs text-zinc-600">Powered by QR Expendifii.com</p>
      </div>
    </div>
  );
}
