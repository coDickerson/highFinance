import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // googleapis is a large Node library that should not be bundled.
  serverExternalPackages: ["googleapis"],
};

export default nextConfig;
