import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Landing-page placeholder photography — swap for real images and
      // remove this once they're replaced.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
