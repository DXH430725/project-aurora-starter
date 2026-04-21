import type { NextConfig } from "next";

// When deploying as a sub-path of another site (e.g. main.example.com/aurora),
// set BASE_PATH=/aurora at build time. Leave unset for root deploys.
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  env: {
    // Expose to runtime so auth cookie can be scoped correctly.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
