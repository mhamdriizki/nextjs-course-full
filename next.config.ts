import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  reactCompiler: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "11mb"
    }
  },

  cacheLife: {
    blog: {
      stale: 3600, // 1 jam
      revalidate: 900, // 15 menit
      expire: 86400 // 1 hari
    }
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  }
};

export default bundleAnalyzer(nextConfig);
