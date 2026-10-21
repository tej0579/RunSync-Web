import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable floating development overlay indicators (the black circular "N" badge)
  devIndicators: false,

  // Treat heavy Google API clients as external to prevent Turbopack bundle corruption on serverless runtimes
  serverExternalPackages: ["googleapis"],

  // Allow phone network connection to receive live HMR updates in development
  allowedDevOrigins: ["10.34.117.48", "10.34.117.48:3000"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
