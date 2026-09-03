"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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
}>(function PosterPreviewCanvas({ reviewUrl, fields, sizeKey, designKey, className, onRenderChange }, forwardedRef) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(forwardedRef, () => canvasRef.current as HTMLCanvasElement);

  useEffect(() => {
    if (!canvasRef.current || !reviewUrl) return;
    let cancelled = false;
    onRenderChange?.(true);
    drawQrPoster(canvasRef.current, reviewUrl, fields, sizeKey, designKey)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) onRenderChange?.(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewUrl, sizeKey, designKey, fields.eyebrow, fields.heading, fields.subheading, fields.displayName, fields.footer]);

  return <canvas ref={canvasRef} className={className} />;
});
