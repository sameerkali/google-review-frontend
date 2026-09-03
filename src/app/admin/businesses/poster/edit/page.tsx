"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "../../../_lib/context";
import { getPosterCategory, getPosterDesign, getPosterSize } from "@/lib/qrPoster";
import { PosterEditor, PosterMissingSerial } from "@/components/PosterFlowSteps";

/* Step 4 of 4 - edit the text sections on the left, watch the canvas
   redraw live on the right (same draw code as the download itself), then
   export. The QR code always encodes the business's real review URL and is
   never editable. */
function PosterEditPage() {
  const { toast } = useAdmin();
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const businessName = searchParams.get("name") || "Business";
  const category = getPosterCategory(searchParams.get("category"));
  const size = getPosterSize(searchParams.get("size"));
  const design = getPosterDesign(searchParams.get("design"));

  if (!serial) {
    return (
      <PosterMissingSerial
        message={`No QR code was specified. Go to Businesses, open a business's QR code, then use "Customize Poster" from there.`}
        backHref="/admin/businesses"
        backLabel="Back to Businesses"
      />
    );
  }

  const designStepHref = `/admin/businesses/poster/design?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(businessName)}&category=${category.key}&size=${size.key}`;

  return (
    <PosterEditor
      toast={toast}
      businessName={businessName}
      serial={serial}
      size={size}
      design={design}
      stepLabel="Step 4 of 4"
      subtitle={
        <>
          For <span className="text-fg font-medium">{businessName}</span> - {category.label} - {design.label}, {size.label} ({size.sublabel}). The QR always points to their real review link.
        </>
      }
      designStepHref={designStepHref}
    />
  );
}

export default function PosterEditRoute() {
  return (
    <Suspense fallback={null}>
      <PosterEditPage />
    </Suspense>
  );
}
