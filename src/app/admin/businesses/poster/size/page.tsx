"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPosterCategory } from "@/lib/qrPoster";
import { PosterSizeGrid, PosterMissingSerial } from "@/components/PosterFlowSteps";

/* Step 2 of 4 - pick a print size (aspect ratio + target resolution). */
function SizeStep() {
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const name = searchParams.get("name") || "Business";
  const categoryKey = searchParams.get("category") || "";

  if (!serial) {
    return (
      <PosterMissingSerial
        message={`No QR code was specified. Go to Businesses, open a business's QR code, then use "Customize Poster" from there.`}
        backHref="/admin/businesses"
        backLabel="Back to Businesses"
      />
    );
  }

  const category = getPosterCategory(categoryKey);
  const backHref = `/admin/businesses/poster?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}`;

  return (
    <PosterSizeGrid
      name={name}
      stepLabel="Step 2 of 4"
      subtitle={`${category.label} - pick the print size, then a design.`}
      backHref={backHref}
      backLabel="Change category"
      buildDesignHref={(sizeKey) =>
        `/admin/businesses/poster/design?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&category=${category.key}&size=${sizeKey}`
      }
    />
  );
}

export default function PosterSizePage() {
  return (
    <Suspense fallback={null}>
      <SizeStep />
    </Suspense>
  );
}
