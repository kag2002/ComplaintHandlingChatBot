import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'wanting-discussions-psychology-inclusive.trycloudflare.com',
    'day-alpha-reflect-pieces.trycloudflare.com',
    '*.trycloudflare.com'
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
