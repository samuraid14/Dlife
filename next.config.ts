import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Multipart uploads pass through Vinext's shared form-body boundary.
  // The media endpoint enforces the stricter 20 MiB file limit itself.
  experimental: { serverActions: { bodySizeLimit: "21mb" } },
};
export default nextConfig;
