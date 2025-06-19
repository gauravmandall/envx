import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    optimizeCss: false
  }
};

export default nextConfig;
