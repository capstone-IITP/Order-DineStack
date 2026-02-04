import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/order',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
