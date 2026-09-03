"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { designsForCategory, getPosterCategory, getPosterSize, qrPosterDefaults } from "@/lib/qrPoster";
import { PosterDesignGrid, PosterMissingSerial } from "@/components/PosterFlowSteps";

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
  const size = getPosterSize(sizeKey);
  const designs = designsForCategory(category.key);
  const fields = qrPosterDefaults(name);
  const backHref = `/admin/businesses/poster/size?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&category=${category.key}`;

  return (
    <PosterDesignGrid
      designs={designs}
      reviewUrl={reviewUrl}
      fields={fields}
      sizeKey={size.key}
      stepLabel="Step 3 of 4"
      subtitle={
        <>For <span className="text-fg font-medium">{name}</span> - {category.label} - {size.label} ({size.sublabel})</>
      }
      backHref={backHref}
      buildEditHref={(designKey) =>
        `/admin/businesses/poster/edit?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(name)}&category=${category.key}&size=${size.key}&design=${designKey}`
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
