import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow your phone's network connection to receive live HMR updates
  allowedDevOrigins: ["10.34.117.48", "10.34.117.48:3000"],

  /* preserve any other existing configuration options here */
};

export default nextConfig;