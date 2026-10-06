import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Let local tooling (Playwright via 127.0.0.1) load /_next assets in dev.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
