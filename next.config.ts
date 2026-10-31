import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;

