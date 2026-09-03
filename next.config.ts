import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Landing-page placeholder photography — swap for real images and
      // remove this once they're replaced.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Clickjacking: nothing in this app is meant to be framed.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops the browser guessing content-types away from what the
          // server declares - closes a class of MIME-sniffing XSS.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Cross-origin pages never see our full URL (query strings can
          // carry review/session context) in their Referer header.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
