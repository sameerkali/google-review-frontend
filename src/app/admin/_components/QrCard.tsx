"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { ToastFn } from "../_lib/types";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "../_lib/icons";

/* ─── QR Card (shared: QR Simulator, Businesses "View QR", Onboarding Wizard) ── */
export function QrCard({
  reviewUrl, businessName, toast, badgeLabel = "Verified", compact = false,
}: {
  reviewUrl: string;
  businessName: string;
  toast: ToastFn;
  badgeLabel?: string;
  /** Force a stacked layout — the row split relies on a viewport-width
      breakpoint, which is wrong inside a narrow container like a modal. */
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Draw the QR AFTER React has committed the canvas to the DOM
  useEffect(() => {
    if (!reviewUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, reviewUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => toast("error", "Failed to render QR code"));
  }, [reviewUrl, toast]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(reviewUrl)
      .then(() => {
        setCopied(true);
        toast("info", "Link copied to clipboard");
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => toast("error", "Could not copy to clipboard"));
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white truncate">QR Code for <span className="text-emerald-400">{businessName}</span></h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {badgeLabel}
        </span>
      </div>
      <div className={`flex flex-col gap-6 ${compact ? "items-center text-center" : "items-start sm:flex-row sm:text-left"}`}>
        {/* Canvas renders the QR code */}
        <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0">
          <canvas ref={canvasRef} className="block" />
        </div>
        <div className="space-y-4 flex-1 min-w-0">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Review URL</p>
            <code className="block text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 break-all">
              {reviewUrl}
            </code>
          </div>
          <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
            >
              {copied ? (
                <><CheckIcon className="w-4 h-4 text-emerald-400" /> Copied!</>
              ) : (
                <><CopyIcon className="w-4 h-4" /> Copy Link</>
              )}
            </button>
            <button
              onClick={() => window.open(reviewUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Open Review Page
            </button>
          </div>
          <p className="text-xs text-zinc-600">
            Scan the QR with your phone camera or tap &quot;Open Review Page&quot; to test the customer experience.
          </p>
        </div>
      </div>
    </div>
  );
}
