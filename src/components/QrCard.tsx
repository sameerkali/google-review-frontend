"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import type { ToastFn } from "@/lib/types";
import { downloadQrPoster } from "@/lib/qrPoster";
import { CheckIcon, CopyIcon, ExternalLinkIcon, DownloadIcon } from "@/components/icons";

/* ─── QR Card (shared: Businesses "View QR", Onboarding Wizard) ── */
export function QrCard({
  reviewUrl, businessName, toast, badgeLabel = "Verified", compact = false, posterHref,
}: {
  reviewUrl: string;
  businessName: string;
  toast: ToastFn;
  badgeLabel?: string;
  /** Force a stacked layout - the row split relies on a viewport-width
      breakpoint, which is wrong inside a narrow container like a modal. */
  compact?: boolean;
  /** When provided (Businesses list → "View QR"), swaps the one-click
      poster download for a link to the full poster editor instead. */
  posterHref?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const downloadPoster = async () => {
    setDownloading(true);
    try {
      await downloadQrPoster({ reviewUrl, businessName });
    } catch {
      toast("error", "Could not generate the poster");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-fg truncate">QR Code for <span className="text-brand">{businessName}</span></h3>
        <span className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 rounded-full px-2.5 py-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
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
            <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Review URL</p>
            <code className="block text-xs text-brand bg-brand/10 border border-brand/20 rounded-lg px-3 py-2 break-all">
              {reviewUrl}
            </code>
          </div>
          <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2 text-sm font-medium text-fg-tertiary hover:text-fg hover:border-fg-quaternary transition-all duration-150 cursor-pointer"
            >
              {copied ? (
                <><CheckIcon className="w-4 h-4 text-success" /> Copied!</>
              ) : (
                <><CopyIcon className="w-4 h-4" /> Copy Link</>
              )}
            </button>
            <button
              onClick={() => window.open(reviewUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover px-4 py-2 text-sm font-semibold text-white transition-all duration-150 cursor-pointer"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Open Review Page
            </button>
            {posterHref ? (
              <Link
                href={posterHref}
                className="flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2 text-sm font-medium text-fg-tertiary hover:text-fg hover:border-fg-quaternary transition-all duration-150 cursor-pointer"
              >
                <DownloadIcon className="w-4 h-4" />
                Customize Poster
              </Link>
            ) : (
              <button
                onClick={downloadPoster}
                disabled={downloading}
                className="flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2 text-sm font-medium text-fg-tertiary hover:text-fg hover:border-fg-quaternary transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-4 h-4" />
                {downloading ? "Preparing…" : "Download Poster"}
              </button>
            )}
          </div>
          <p className="text-xs text-fg-quaternary">
            Scan the QR with your phone camera, tap &quot;Open Review Page&quot; to test the customer experience, or {posterHref ? "customize a printable poster for your counter" : "download a printable poster for your counter"}.
          </p>
        </div>
      </div>
    </div>
  );
}
