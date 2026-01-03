import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');
console.log('withNextIntl plugin loaded', withNextIntl);

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

export default withNextIntl(nextConfig);