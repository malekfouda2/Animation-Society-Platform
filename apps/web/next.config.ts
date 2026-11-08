import type { NextConfig } from "next";
import { loadWebEnv } from "./src/config/env";

const env = loadWebEnv();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Development convenience: keep browser API calls same-origin (/api/v1 on :3000 -> Express).
  // Production fronts both apps with one reverse proxy that routes /api/v1 to the API directly.
  rewrites() {
    return Promise.resolve([
      { source: "/api/v1/:path*", destination: `${env.API_INTERNAL_ORIGIN}/api/v1/:path*` },
    ]);
  },
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ]);
  },
};

export default nextConfig;
