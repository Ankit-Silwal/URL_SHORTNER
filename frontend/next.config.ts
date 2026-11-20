import type { NextConfig } from "next";

// Where the Express API runs. Override with BACKEND_URL in production.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  rewrites() {
    return {
      beforeFiles: [],
      // /api/shorten -> backend /shorten (browser talks to one origin, so no CORS).
      afterFiles: [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }],
      // Anything that isn't a page (e.g. /aB3x9k2) is a short code: let the backend redirect it.
      fallback: [{ source: "/:code([0-9A-Za-z]{7})", destination: `${BACKEND_URL}/:code` }],
    };
  },
};

export default nextConfig;
