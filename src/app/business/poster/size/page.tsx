"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { POSTER_SIZES } from "@/lib/qrPoster";
import { ArrowLeftIcon, QrIcon } from "@/components/icons";

/* Step 1 of 3 — pick a print size (aspect ratio + target resolution). No
   category step here (unlike the admin flow at /admin/businesses/poster,
   which asks cafe/salon/doctor to narrow the design list) — a business
   already knows what it is, and the design step shows the full library
   regardless, so asking again added a step without adding a choice. */
function SizeStep() {
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const name = searchParams.get("name") || "Business";

  if (!serial) return <MissingSerial />;

  return (
    <div className="max-w-5xl">
      <Link
        href="/business/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-brand uppercase tracking-wider mb-1">Step 1 of 3</p>
        <h2 className="text-lg font-semibold text-fg">Choose a size</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">
          For <span className="text-fg font-medium">{name}</span> — pick the print size, then a design.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {POSTER_SIZES.map((s) => (
          <Link
            key={s.key}
            href={`/business/poster/design?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&size=${s.key}`}
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

function MissingSerial() {
  return (
    <div className="max-w-lg">
      <p className="text-sm text-fg-tertiary">
        No QR code is linked to your account yet — contact your platform admin to get one set up.
      </p>
      <Link href="/business/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand hover:text-brand-hover">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}

export default function PosterSizePage() {
  return (
    <Suspense fallback={null}>
      <SizeStep />
    </Suspense>
  );
}
