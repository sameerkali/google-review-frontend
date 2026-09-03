"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { POSTER_CATEGORIES } from "@/lib/qrPoster";
import { ArrowLeftIcon, StorefrontIcon } from "@/components/icons";

/* Step 1 of 4 - pick a business category, which narrows the design list in
   step 3 to what's actually relevant. Reached only from Businesses list →
   eye icon → QR modal → "Customize Poster", which passes the hardware
   serial and business name as query params carried through the whole
   flow. */
function CategoryStep() {
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const name = searchParams.get("name") || "Business";

  if (!serial) return <MissingSerial />;

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/businesses"
        className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Businesses
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">Step 1 of 4</p>
        <h2 className="text-lg font-semibold text-fg">Choose a category</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">
          For <span className="text-fg font-medium">{name}</span> - this narrows down the designs you&apos;ll see next.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {POSTER_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/admin/businesses/poster/size?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&category=${c.key}`}
            className="group rounded-2xl border border-border bg-surface p-5 hover:border-brand/50 hover:bg-brand/5 transition-all duration-150 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-brand/12 border border-brand/25 group-hover:bg-brand/20 transition-colors flex items-center justify-center shrink-0">
              <StorefrontIcon className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">{c.label}</p>
              <p className="text-xs text-fg-quaternary mt-0.5">{c.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
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

export default function PosterCategoryPage() {
  return (
    <Suspense fallback={null}>
      <CategoryStep />
    </Suspense>
  );
}
