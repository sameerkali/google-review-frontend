"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "../../_lib/context";
import { drawQrPoster, downloadCanvasPng, qrPosterDefaults, slugifyForFilename, type QrPosterFields } from "@/lib/qrPoster";
import { Spinner } from "@/components/Loaders";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ArrowLeftIcon, DownloadIcon } from "@/components/icons";

/* Two-panel poster editor: edit the text sections on the left, watch the
   canvas redraw live on the right, download the PNG when it looks right.
   The QR code always encodes the business's real review URL and is never
   editable — only reachable via "Customize Poster" on a business's QR
   modal (Businesses list → eye icon), which passes the hardware serial and
   business name in as query params. */
function PosterEditor() {
  const { toast } = useAdmin();
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const businessName = searchParams.get("name") || "Business";

  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const reviewUrl = origin && serial ? `${origin}/r/${encodeURIComponent(serial)}` : "";

  const [fields, setFields] = useState<QrPosterFields>(() => qrPosterDefaults(businessName));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const update = (key: keyof QrPosterFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  // Small debounce so redraw (which regenerates the QR bitmap too) doesn't
  // fire on every keystroke.
  useEffect(() => {
    if (!reviewUrl || !canvasRef.current) return;
    setRendering(true);
    const canvas = canvasRef.current;
    const timer = setTimeout(() => {
      drawQrPoster(canvas, reviewUrl, fields)
        .catch(() => toast("error", "Could not render the poster preview"))
        .finally(() => setRendering(false));
    }, 150);
    return () => clearTimeout(timer);
  }, [reviewUrl, fields, toast]);

  const download = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      await downloadCanvasPng(canvasRef.current, `${slugifyForFilename(businessName)}-review-qr-poster.png`);
    } catch {
      toast("error", "Could not download the poster");
    } finally {
      setDownloading(false);
    }
  };

  if (!serial) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-fg-tertiary">
          No QR code was specified. Go to Businesses, open a business&apos;s QR code, then use &quot;Customize Poster&quot; from there.
        </p>
        <Link href="/admin/businesses" className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand hover:text-brand-hover">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <Link
        href="/admin/businesses"
        className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Businesses
      </Link>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-fg">Customize Poster</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">
            For <span className="text-fg font-medium">{businessName}</span> — the QR always points to their real review link.
          </p>
        </div>
        <Button onClick={download} loading={downloading} loadingText="Preparing…" variant="primary" disabled={rendering}>
          <DownloadIcon className="w-4 h-4" />
          Download PNG
        </Button>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Edit panel */}
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <Field label="Eyebrow" htmlFor="poster-eyebrow">
            <Input id="poster-eyebrow" value={fields.eyebrow} onChange={update("eyebrow")} maxLength={40} />
          </Field>
          <Field label="Heading" htmlFor="poster-heading">
            <Input id="poster-heading" value={fields.heading} onChange={update("heading")} maxLength={24} />
          </Field>
          <Field label="Subheading" htmlFor="poster-subheading">
            <Input id="poster-subheading" value={fields.subheading} onChange={update("subheading")} maxLength={40} />
          </Field>
          <Field label="Business name" htmlFor="poster-name">
            <Input id="poster-name" value={fields.displayName} onChange={update("displayName")} maxLength={60} />
          </Field>
          <Field label="Footer" htmlFor="poster-footer">
            <Input id="poster-footer" value={fields.footer} onChange={update("footer")} maxLength={40} />
          </Field>
          <button
            type="button"
            onClick={() => setFields(qrPosterDefaults(businessName))}
            className="text-xs font-medium text-fg-quaternary hover:text-fg-tertiary transition-colors cursor-pointer"
          >
            Reset to defaults
          </button>
        </div>

        {/* Live preview */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-border">
            <canvas ref={canvasRef} className="block w-full h-auto" />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <Spinner size="md" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosterPage() {
  return (
    <Suspense fallback={null}>
      <PosterEditor />
    </Suspense>
  );
}
