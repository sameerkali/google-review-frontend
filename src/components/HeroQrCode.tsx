"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/* A real, scannable QR code (same qrcode.toCanvas call the rest of the app
   uses for actual business review codes) encoding this page's own URL. Not
   a placeholder graphic - scan it and it opens this site. */
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
      <div className={`relative rounded-2xl bg-white p-3 shadow-xl transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
        <canvas ref={canvasRef} width={size} height={size} className="block rounded" role="img" aria-label="QR code linking to this page" />
      </div>
    </div>
  );
}
