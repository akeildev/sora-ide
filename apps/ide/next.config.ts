import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/types", "@repo/utils"],
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config) => {
    // Fix Yjs double import warning
    // https://github.com/yjs/yjs/issues/438
    // Use path.resolve to ensure single instance
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: path.resolve(__dirname, 'node_modules/yjs'),
    };

    return config;
  },
};

export default nextConfig;
