"use client";

import { use, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertIcon, CheckIcon, CopyIcon, StarFillIcon } from "@/components/icons";
import { Spinner } from "@/components/Loaders";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoogleG } from "@/components/GoogleReviewCard";

type Suggestion = { id: string; text: string };
type Business = { name: string; logoUrl?: string; googleReviewUrl: string };
type BizData = {
  business: Business;
  suggestions: Suggestion[];
  hardware: { code: string };
};

// Which of the two chosen directions renders — flip by hand as needed,
// no UI for switching it (this is a design choice, not a user setting).
const PLAYFUL_DEFAULT = true;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type CardProps = {
  business: Business;
  suggestions: Suggestion[];
  copiedId: string | null;
  onCopy: (s: Suggestion) => void;
  onGoogle: () => void;
};

function IdentityAvatar({ business, ringClassName, textClassName }: { business: Business; ringClassName: string; textClassName: string }) {
  return (
    <div className={`w-[88px] h-[88px] rounded-full p-1 mx-auto ${ringClassName}`}>
      {business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={business.logoUrl} alt={business.name} className="w-full h-full rounded-full object-cover bg-white" />
      ) : (
        <div className={`w-full h-full rounded-full bg-white flex items-center justify-center font-semibold text-2xl ${textClassName}`}>
          {initials(business.name)}
        </div>
      )}
    </div>
  );
}

function DecorativeStars({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarFillIcon key={i} className={className} style={{ color: "#FBBC04" }} />
      ))}
    </div>
  );
}

/* Consumer-app energy: rounded everything, a mint-to-sky ground, review
   suggestions you swipe through like cards. */
function PlayfulReviewCard({ business, suggestions, copiedId, onCopy, onGoogle }: CardProps) {
  return (
    <div className="w-full text-center">
      <IdentityAvatar
        business={business}
        ringClassName="bg-[linear-gradient(135deg,#ff8a65,#7c6cf0)]"
        textClassName="text-[#7c6cf0]"
      />
      <h1 className="text-xl font-semibold text-[#22242b] mt-4">{business.name}</h1>
      <p className="text-sm text-[#6a6d7a] mt-1.5">Tell us how it went!</p>
      <div className="mt-4">
        <DecorativeStars />
      </div>

      {suggestions.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 mt-6 -mx-6 px-6 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((s) => {
            const isCopied = copiedId === s.id;
            return (
              <div key={s.id} className="shrink-0 w-[210px] snap-start rounded-2xl bg-white p-3.5 text-left shadow-[0_8px_20px_-10px_rgba(34,36,43,0.2)]">
                <p className="text-[12.5px] leading-relaxed text-[#4a4d59] min-h-[62px]">{s.text}</p>
                <button
                  onClick={() => onCopy(s)}
                  className={`mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                    isCopied ? "bg-emerald-50 text-emerald-600" : "bg-[#f1eefe] text-[#7c6cf0] hover:bg-[#e6e0fd]"
                  }`}
                >
                  {isCopied ? (<><CheckIcon className="w-3.5 h-3.5" /> Copied</>) : (<><CopyIcon className="w-3.5 h-3.5" /> Copy</>)}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onGoogle}
        className="mt-6 w-full rounded-full bg-[#ff5a36] py-4 text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-transform duration-150 cursor-pointer shadow-[0_12px_26px_-10px_rgba(255,90,54,0.55)]"
      >
        <GoogleG className="w-[18px] h-[18px]" />
        Leave a Google Review
      </button>
    </div>
  );
}

/* The business's own warmth leads; Google shows up as a small trusted
   badge riding the CTA corner, not the whole page's voice. */
function WarmReviewCard({ business, suggestions, copiedId, onCopy, onGoogle }: CardProps) {
  return (
    <div className="w-full text-center">
      <IdentityAvatar
        business={business}
        ringClassName="bg-[conic-gradient(from_200deg,#ff8a5c,#ff5a36,#ffb37a,#ff8a5c)]"
        textClassName="text-[#ff5a36]"
      />
      <h1 className="text-[22px] font-semibold text-[#2c1a10] mt-4 tracking-tight">{business.name}</h1>
      <p className="text-sm text-[#8a6f61] mt-1.5">We&apos;d love your feedback!</p>
      <div className="mt-4 mb-2">
        <DecorativeStars />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-6">
          {suggestions.map((s) => {
            const isCopied = copiedId === s.id;
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white border border-[#ffe3d1] p-3.5 text-left">
                <p className="flex-1 text-[13px] leading-relaxed text-[#4a3226] min-w-0">{s.text}</p>
                <button
                  onClick={() => onCopy(s)}
                  className={`shrink-0 flex items-center justify-center rounded-full p-2.5 transition-all duration-150 cursor-pointer active:scale-95 ${
                    isCopied ? "bg-emerald-50 text-emerald-600" : "bg-[#fff0e6] text-[#ff5a36] hover:bg-[#ffe3d1]"
                  }`}
                >
                  {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative mt-6">
        <div className="absolute -top-2.5 right-3.5 w-[30px] h-[30px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center">
          <GoogleG className="w-4 h-4" />
        </div>
        <button
          onClick={onGoogle}
          className="w-full rounded-full bg-[#ff5a36] py-4 text-white font-semibold text-[15px] hover:brightness-95 active:scale-95 transition-all duration-150 cursor-pointer shadow-[0_10px_24px_-8px_rgba(255,90,54,0.5)]"
        >
          Leave a Google Review
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [googleUrlError, setGoogleUrlError] = useState("");
  // Toggle between the two chosen review-page designs — edit the boolean
  // above (PLAYFUL_DEFAULT) to switch which one ships.
  const [playful] = useState(PLAYFUL_DEFAULT);

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

  // Both designs are fixed, light, always-on palettes (same precedent as
  // the landing hero's wavy background) — not built from the app's
  // dark/light tokens, so they read the same regardless of site theme.
  const pageBg = playful
    ? "bg-[linear-gradient(165deg,#eafff3_0%,#eaf2ff_100%)]"
    : "bg-[#fff4ec]";

  return (
    <div className={`min-h-dvh flex flex-col items-center justify-center p-6 relative ${pageBg}`}>
      <ThemeToggle className="fixed top-4 right-4 bg-white/70 backdrop-blur-md border border-black/10 text-zinc-600 hover:text-zinc-900 hover:bg-white/90 shadow-sm" />

      <div className="w-full max-w-sm animate-rise-in">
        {playful ? (
          <PlayfulReviewCard business={business} suggestions={suggestions} copiedId={copiedId} onCopy={handleCopy} onGoogle={handleGoogle} />
        ) : (
          <WarmReviewCard business={business} suggestions={suggestions} copiedId={copiedId} onCopy={handleCopy} onGoogle={handleGoogle} />
        )}

        {googleUrlError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {googleUrlError}
          </div>
        )}

        <p className="text-center text-xs text-black/35 mt-5">Powered by Expendifii</p>
      </div>
    </div>
  );
}
