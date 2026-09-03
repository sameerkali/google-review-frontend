"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { POSTER_DESIGNS, getPosterSize, qrPosterDefaults } from "@/lib/qrPoster";
import { PosterDesignGrid, PosterMissingSerial } from "@/components/PosterFlowSteps";

/* Step 2 of 3 - pick a design. Unlike the admin flow, this shows the full
   design library rather than a category-filtered subset - there's no
   business-category step here (see size/page.tsx), so this is the one
   place a business picks a look at all. Each option renders a real,
   full-resolution preview at the size chosen in step 1 (same draw code the
   final download uses), so this is a true WYSIWYG picker, not thumbnails. */
function DesignStep() {
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") || "";
  const name = searchParams.get("name") || "Business";
  const sizeKey = searchParams.get("size") || "card";

  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const reviewUrl = origin && serial ? `${origin}/r/${encodeURIComponent(serial)}` : "";

  if (!serial) {
    return (
      <PosterMissingSerial
        message="No QR code is linked to your account yet - contact your platform admin to get one set up."
        backHref="/business/dashboard"
        backLabel="Back to Dashboard"
      />
    );
  }

  const size = getPosterSize(sizeKey);
  const fields = qrPosterDefaults(name);
  const backHref = `/business/poster/size?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}`;

  return (
    <PosterDesignGrid
      designs={POSTER_DESIGNS}
      reviewUrl={reviewUrl}
      fields={fields}
      sizeKey={size.key}
      stepLabel="Step 2 of 3"
      subtitle={
        <>For <span className="text-fg font-medium">{name}</span> - {size.label} ({size.sublabel})</>
      }
      backHref={backHref}
      buildEditHref={(designKey) =>
        `/business/poster/edit?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&size=${size.key}&design=${designKey}`
      }
    />
  );
}

export default function PosterDesignPage() {
  return (
    <Suspense fallback={null}>
      <DesignStep />
    </Suspense>
  );
}
