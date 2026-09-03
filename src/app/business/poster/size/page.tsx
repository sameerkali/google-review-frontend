"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PosterSizeGrid, PosterMissingSerial } from "@/components/PosterFlowSteps";

/* Step 1 of 3 - pick a print size (aspect ratio + target resolution). No
   category step here (unlike the admin flow at /admin/businesses/poster,
   which asks cafe/salon/doctor to narrow the design list) - a business
   already knows what it is, and the design step shows the full library
   regardless, so asking again added a step without adding a choice. */
function SizeStep() {
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const name = searchParams.get("name") || "Business";

  if (!serial) {
    return (
      <PosterMissingSerial
        message="No QR code is linked to your account yet - contact your platform admin to get one set up."
        backHref="/business/dashboard"
        backLabel="Back to Dashboard"
      />
    );
  }

  return (
    <PosterSizeGrid
      name={name}
      stepLabel="Step 1 of 3"
      subtitle="pick the print size, then a design."
      backHref="/business/dashboard"
      backLabel="Back to Dashboard"
      buildDesignHref={(sizeKey) => `/business/poster/design?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&size=${sizeKey}`}
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
