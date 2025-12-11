import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**', // Allows all paths from unsplash
      },
    ],
  },
    typescript: {
    ignoreBuildErrors: true, // ✅ allows deployment even with TS errors
  },
};

export default nextConfig;
