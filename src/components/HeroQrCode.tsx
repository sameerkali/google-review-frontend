"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/* A real, scannable QR code (same qrcode.toCanvas call the rest of the app
   uses for actual business review codes) encoding this page's own URL. Not
   a placeholder graphic — scan it and it opens this site. */
export function HeroQrCode({ size = 176 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const url = typeof window !== "undefined" ? window.location.href : "https://qrreview.app";
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: "#3b6cf0", light: "#ffffff" },
    })
      .then(() => setReady(true))
      .catch(() => {});
  }, [size]);

  return (
    <div className="relative inline-block">
      {/* Continuous soft pulse ring: an invitation cue ("this is live, scan
          it"), the one motivated loop on the page. Frozen under reduced
          motion instead of removed, so the affordance is still visible. */}
      <span className="absolute inset-0 rounded-2xl bg-brand/30 animate-qr-pulse motion-reduce:animate-none motion-reduce:opacity-0" aria-hidden />
      <div className={`relative rounded-2xl bg-white p-3 shadow-xl transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
        <canvas ref={canvasRef} width={size} height={size} className="block rounded" />
      </div>
    </div>
  );
}
