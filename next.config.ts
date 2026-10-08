import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let local tooling (Playwright via 127.0.0.1) load /_next assets in dev.
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
