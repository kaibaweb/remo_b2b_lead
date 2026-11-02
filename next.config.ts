import type { NextConfig } from "next";

const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-8e31df4a388b4fb99674cb6938edfc4f.r2.dev';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-8e31df4a388b4fb99674cb6938edfc4f.r2.dev',
      },
    ],
  },
  serverExternalPackages: ['firebase-admin'],
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${R2_PUBLIC_DOMAIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
