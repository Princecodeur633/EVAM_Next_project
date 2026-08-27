import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Django exige le slash final ; Next ne doit pas rediriger /api/foo/ vers /api/foo.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
