import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Keep the Webpack fix for compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "thread-stream/test/create-and-exit.js": false,
    };
    return config;
  },
};

export default nextConfig;