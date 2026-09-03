"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { designsForCategory, getPosterCategory, getPosterSize, qrPosterDefaults, type PosterDesignKey, type PosterSizeKey } from "@/lib/qrPoster";
import { PosterPreviewCanvas } from "@/components/PosterPreviewCanvas";
import { ArrowLeftIcon } from "@/components/icons";

/* Step 3 of 4 - pick a design, narrowed to whatever's relevant for the
   chosen category. Each option renders a real, full-resolution preview at
   the size chosen in step 2 (same draw code the final download uses), so
   this is a true WYSIWYG picker rather than static thumbnails. */
function DesignStep() {
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const name = searchParams.get("name") || "Business";
  const categoryKey = searchParams.get("category") || "";
  const sizeKey = searchParams.get("size") || "card";

  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const reviewUrl = origin && serial ? `${origin}/r/${encodeURIComponent(serial)}` : "";

  if (!serial) return <MissingSerial />;

  const category = getPosterCategory(categoryKey);
  const size = getPosterSize(sizeKey);
  const designs = designsForCategory(category.key);
  const fields = qrPosterDefaults(name);
  const backHref = `/admin/businesses/poster/size?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&category=${category.key}`;

  return (
    <div className="max-w-6xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Change size
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">Step 3 of 4</p>
        <h2 className="text-lg font-semibold text-fg">Choose a design</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">
          For <span className="text-fg font-medium">{name}</span> - {category.label} - {size.label} ({size.sublabel})
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {designs.map((d) => (
          <DesignCard
            key={d.key}
            reviewUrl={reviewUrl}
            fields={fields}
            sizeKey={size.key}
            designKey={d.key}
            label={d.label}
            description={d.description}
            href={`/admin/businesses/poster/edit?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&category=${category.key}&size=${size.key}&design=${d.key}`}
          />
        ))}
      </div>
    </div>
  );
}

function DesignCard({
  reviewUrl, fields, sizeKey, designKey, label, description, href,
}: {
  reviewUrl: string;
  fields: ReturnType<typeof qrPosterDefaults>;
  sizeKey: PosterSizeKey;
  designKey: PosterDesignKey;
  label: string;
  description: string;
  href: string;
}) {
  const [rendering, setRendering] = useState(true);
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-brand/50 transition-all duration-150"
    >
      <div className="relative bg-surface-inset flex items-center justify-center" style={{ height: 280 }}>
        {reviewUrl && (
          <PosterPreviewCanvas
            reviewUrl={reviewUrl}
            fields={fields}
            sizeKey={sizeKey}
            designKey={designKey}
            onRenderChange={setRendering}
            className="w-full h-full object-contain p-3"
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

function MissingSerial() {
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

export default function PosterDesignPage() {
  return (
    <Suspense fallback={null}>
      <DesignStep />
    </Suspense>
  );
}
