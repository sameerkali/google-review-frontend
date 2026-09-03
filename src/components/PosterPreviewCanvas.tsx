"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { drawQrPoster, type PosterSizeKey, type PosterDesignKey, type QrPosterFields } from "@/lib/qrPoster";

/* Renders a poster onto a real (full-resolution) canvas and lets CSS scale
   it down for display - used for the design-picker thumbnails and the
   editor's live preview, so both share exactly the same drawing code the
   final download uses. Forwards the canvas ref so a caller (the editor's
   download button) can read the exact same element that's on screen. */
export const PosterPreviewCanvas = forwardRef<HTMLCanvasElement, {
  reviewUrl: string;
  fields: QrPosterFields;
  sizeKey: PosterSizeKey;
  designKey: PosterDesignKey;
  className?: string;
  onRenderChange?: (rendering: boolean) => void;
  /** Accessible name for the canvas - a canvas has no text content of its
      own, so without this a screen reader announces nothing at all here. */
  label?: string;
}>(function PosterPreviewCanvas({ reviewUrl, fields, sizeKey, designKey, className, onRenderChange, label }, forwardedRef) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);
  useImperativeHandle(forwardedRef, () => canvasRef.current as HTMLCanvasElement);

  useEffect(() => {
    if (!canvasRef.current || !reviewUrl) return;
    let cancelled = false;
    onRenderChange?.(true);
    setHasError(false);
    drawQrPoster(canvasRef.current, reviewUrl, fields, sizeKey, designKey)
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) onRenderChange?.(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewUrl, sizeKey, designKey, fields.eyebrow, fields.heading, fields.subheading, fields.displayName, fields.footer]);

  if (hasError) {
    return (
      <div role="alert" className={`flex items-center justify-center bg-surface-inset text-center p-4 ${className || ""}`}>
        <p className="text-xs text-danger">Couldn&apos;t render the preview. Try changing a field to retry.</p>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label || "Poster preview with QR code"} />;
});
