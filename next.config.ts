import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't let a lint hiccup break the hackathon build; `npm run lint` still works.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
