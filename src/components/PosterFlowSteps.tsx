"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  POSTER_SIZES, downloadCanvasPng, qrPosterDefaults,
  type PosterSize, type PosterDesignMeta, type PosterDesignKey, type PosterSizeKey, type QrPosterFields,
} from "@/lib/qrPoster";
import { slugifyForFilename } from "@/lib/utils";
import type { ToastFn } from "@/lib/types";
import { PosterPreviewCanvas } from "@/components/PosterPreviewCanvas";
import { Skeleton } from "@/components/Loaders";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ArrowLeftIcon, DownloadIcon, QrIcon } from "@/components/icons";

/* Presentational pieces shared by the admin (/admin/businesses/poster/*)
   and business (/business/poster/*) poster flows - the two were previously
   near-duplicate page files (only differing in auth context, an optional
   category step, and a few copy/href details), which meant a fix or a11y
   change made in one tree routinely wasn't made in the other (see e.g. the
   generateReportPdf.ts slugify drift this was pulled out alongside). Each
   route file stays responsible for reading its own searchParams and
   Suspense boundary (that part genuinely differs - the admin flow also
   reads a `category` param) and passes the rest down as props. */

export function PosterMissingSerial({ message, backHref, backLabel }: { message: string; backHref: string; backLabel: string }) {
  return (
    <div className="max-w-lg">
      <p className="text-sm text-fg-tertiary">{message}</p>
      <Link href={backHref} className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand hover:text-brand-hover">
        <ArrowLeftIcon className="w-4 h-4" /> {backLabel}
      </Link>
    </div>
  );
}

export function PosterSizeGrid({
  name, stepLabel, subtitle, backHref, backLabel, buildDesignHref,
}: {
  name: string;
  stepLabel: string;
  subtitle: React.ReactNode;
  backHref: string;
  backLabel: string;
  buildDesignHref: (sizeKey: PosterSizeKey) => string;
}) {
  return (
    <div className="max-w-5xl">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4">
        <ArrowLeftIcon className="w-4 h-4" /> {backLabel}
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">{stepLabel}</p>
        <h2 className="text-lg font-semibold text-fg">Choose a size</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">
          For <span className="text-fg font-medium">{name}</span> - {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {POSTER_SIZES.map((s) => (
          <Link
            key={s.key}
            href={buildDesignHref(s.key)}
            className="group rounded-2xl border border-border bg-surface p-4 hover:border-brand/50 hover:bg-brand/5 transition-all duration-150 flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-center" style={{ height: 140 }}>
              <div
                className="rounded-lg bg-brand/12 border border-brand/25 group-hover:bg-brand/20 transition-colors flex items-center justify-center"
                style={{ aspectRatio: `${s.width} / ${s.height}`, height: "100%" }}
              >
                <QrIcon className="w-6 h-6 text-brand/60" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-fg">{s.label}</p>
              <p className="text-xs text-fg-quaternary mt-0.5">{s.sublabel}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PosterDesignCard({
  reviewUrl, fields, sizeKey, designKey, label, description, href,
}: {
  reviewUrl: string;
  fields: QrPosterFields;
  sizeKey: PosterSizeKey;
  designKey: PosterDesignKey;
  label: string;
  description: string;
  href: string;
}) {
  const [rendering, setRendering] = useState(true);
  return (
    <Link href={href} className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-brand/50 transition-all duration-150">
      <div className="relative bg-surface-inset flex items-center justify-center" style={{ height: 280 }}>
        {reviewUrl && (
          <PosterPreviewCanvas
            reviewUrl={reviewUrl}
            fields={fields}
            sizeKey={sizeKey}
            designKey={designKey}
            onRenderChange={setRendering}
            className="w-full h-full object-contain p-3"
            label={`${label} design preview`}
          />
        )}
        {rendering && <div className="absolute inset-0 bg-surface-inset animate-pulse" />}
      </div>
      <div className="p-3.5">
        <p className="text-sm font-semibold text-fg">{label}</p>
        <p className="text-xs text-fg-tertiary mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

export function PosterDesignGrid({
  designs, reviewUrl, fields, sizeKey, stepLabel, subtitle, backHref, buildEditHref,
}: {
  designs: PosterDesignMeta[];
  reviewUrl: string;
  fields: QrPosterFields;
  sizeKey: PosterSizeKey;
  stepLabel: string;
  subtitle: React.ReactNode;
  backHref: string;
  buildEditHref: (designKey: PosterDesignKey) => string;
}) {
  return (
    <div className="max-w-6xl">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4">
        <ArrowLeftIcon className="w-4 h-4" /> Change size
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">{stepLabel}</p>
        <h2 className="text-lg font-semibold text-fg">Choose a design</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {designs.map((d) => (
          <PosterDesignCard
            key={d.key}
            reviewUrl={reviewUrl}
            fields={fields}
            sizeKey={sizeKey}
            designKey={d.key}
            label={d.label}
            description={d.description}
            href={buildEditHref(d.key)}
          />
        ))}
      </div>
    </div>
  );
}

export function PosterEditor({
  toast, businessName, serial, size, design, stepLabel, subtitle, designStepHref,
}: {
  toast: ToastFn;
  businessName: string;
  serial: string;
  size: PosterSize;
  design: PosterDesignMeta;
  stepLabel: string;
  subtitle: React.ReactNode;
  designStepHref: string;
}) {
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

  return (
    <div className="max-w-6xl">
      <Link href={designStepHref} className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4">
        <ArrowLeftIcon className="w-4 h-4" /> Change design
      </Link>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">{stepLabel}</p>
          <h2 className="text-lg font-semibold text-fg">Customize Poster</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">{subtitle}</p>
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
                label={`Live poster preview - ${design.label}, ${size.label}`}
              />
            )}
            {rendering && <Skeleton className="absolute inset-0 rounded-none" />}
          </div>
        </div>
      </div>
    </div>
  );
}
