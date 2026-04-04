import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // ── Compression & minification ──────────────────────────
  compress: true,
  poweredByHeader: false,

  // ── Experimental perf flags ─────────────────────────────
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "xlsx",
      "file-saver",
    ],
  },

  // ── Image optimization ───────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // ── HTTP headers ─────────────────────────────────────────
  async headers() {
    return [
      // Security on all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache fonts
      {
        source: "/fonts/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Short cache on API routes (30s) — avoids hammering MongoDB
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },

  reactStrictMode: true,
};

export default nextConfig;