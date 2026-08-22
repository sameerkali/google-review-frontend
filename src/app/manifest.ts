import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QR Review Platform",
    short_name: "QR Review",
    description: "Scan QR codes to leave reviews for your favourite businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#3b6cf0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
