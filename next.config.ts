import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Het Next.js-ontwikkelaarsicoontje rechtsonder, zodat het de zijbalk niet bedekt.
  devIndicators: { position: "bottom-right" },
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
};

export default nextConfig;
