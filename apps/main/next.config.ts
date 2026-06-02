import type { NextConfig } from "next";

// When deploying as a sub-path of another site (e.g. main.example.com/aurora),
// set BASE_PATH=/aurora at build time. Leave unset for root deploys.
const basePath = process.env.BASE_PATH || "";
const statusZone = process.env.STATUS_ZONE_URL || "https://status.430123.xyz";
const ampZone = process.env.AMP_ZONE_URL || "https://amp.430123.xyz";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  env: {
    // Expose to runtime so auth cookie can be scoped correctly.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/monitor/:path*", destination: `${statusZone}/monitor/:path*` },
        { source: "/status/:path*", destination: `${statusZone}/status/:path*` },
        { source: "/amp/:path*", destination: `${ampZone}/amp/:path*` },
        { source: "/status-assets/:path*", destination: `${statusZone}/_next/:path*` },
        { source: "/amp-assets/:path*", destination: `${ampZone}/_next/:path*` },
      ],
    };
  },
};

export default nextConfig;
