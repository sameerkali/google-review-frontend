"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "../../../_lib/context";
import {
  downloadCanvasPng, getPosterCategory, getPosterDesign, getPosterSize, qrPosterDefaults, slugifyForFilename,
  type QrPosterFields,
} from "@/lib/qrPoster";
import { PosterPreviewCanvas } from "@/components/PosterPreviewCanvas";
import { Skeleton } from "@/components/Loaders";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ArrowLeftIcon, DownloadIcon } from "@/components/icons";

/* Step 4 of 4 - edit the text sections on the left, watch the canvas
   redraw live on the right (same draw code as the download itself), then
   export. The QR code always encodes the business's real review URL and is
   never editable. */
function PosterEditor() {
  const { toast } = useAdmin();
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const businessName = searchParams.get("name") || "Business";
  const category = getPosterCategory(searchParams.get("category"));
  const size = getPosterSize(searchParams.get("size"));
  const design = getPosterDesign(searchParams.get("design"));

  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const reviewUrl = origin && serial ? `${origin}/r/${encodeURIComponent(serial)}` : "";

  const [fields, setFields] = useState<QrPosterFields>(() => qrPosterDefaults(businessName));
  const [rendering, setRendering] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const update = (key: keyof QrPosterFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

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

  const designStepHref = `/admin/businesses/poster/design?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(businessName)}&category=${category.key}&size=${size.key}`;

  return (
    <div className="max-w-6xl">
      <Link
        href={designStepHref}
        className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Change design
      </Link>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">Step 4 of 4</p>
          <h2 className="text-lg font-semibold text-fg">Customize Poster</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">
            For <span className="text-fg font-medium">{businessName}</span> - {category.label} - {design.label}, {size.label} ({size.sublabel}). The QR always points to their real review link.
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

        {/* Live preview - the wrapper is pinned to the poster's real aspect
            ratio from first paint (the canvas itself only gets its true
            width/height once drawQrPoster runs in an effect), so the
            skeleton fills exactly where the artwork lands, no layout jump. */}
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-border"
            style={{ aspectRatio: `${size.width} / ${size.height}` }}
          >
            {reviewUrl && (
              <PosterPreviewCanvas
                ref={canvasRef}
                reviewUrl={reviewUrl}
                fields={fields}
                sizeKey={size.key}
                designKey={design.key}
                onRenderChange={setRendering}
                className="block w-full h-full"
              />
            )}
            {rendering && <Skeleton className="absolute inset-0 rounded-none" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosterEditPage() {
  return (
    <Suspense fallback={null}>
      <PosterEditor />
    </Suspense>
  );
}
