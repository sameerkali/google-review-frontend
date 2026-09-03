"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBusiness } from "../../_lib/context";
import { getPosterDesign, getPosterSize } from "@/lib/qrPoster";
import { PosterEditor, PosterMissingSerial } from "@/components/PosterFlowSteps";

/* Step 3 of 3 - edit the text sections on the left, watch the canvas
   redraw live on the right (same draw code as the download itself), then
   export. The QR code always encodes the business's real review URL and is
   never editable. Mirrors /admin/businesses/poster/edit minus the category
   step - auth context is useBusiness instead of useAdmin, and there's no
   category in the URL to read back. */
function PosterEditPage() {
  const { toast } = useBusiness();
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const businessName = searchParams.get("name") || "Business";
  const size = getPosterSize(searchParams.get("size"));
  const design = getPosterDesign(searchParams.get("design"));

  if (!serial) {
    return (
      <PosterMissingSerial
        message="No QR code is linked to your account yet - contact your platform admin to get one set up."
        backHref="/business/dashboard"
        backLabel="Back to Dashboard"
      />
    );
  }

  const designStepHref = `/business/poster/design?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(businessName)}&size=${size.key}`;

  return (
    <PosterEditor
      toast={toast}
      businessName={businessName}
      serial={serial}
      size={size}
      design={design}
      stepLabel="Step 3 of 3"
      subtitle={`${design.label}, ${size.label} (${size.sublabel}). The QR always points to your real review link.`}
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
