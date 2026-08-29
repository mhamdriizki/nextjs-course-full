import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,

  experimental: {
    serverActions: {
      // Header room above the 5MB image / 10MB doc validation limits
      // (see lib/validation/file.ts) so multipart overhead doesn't
      // trip the framework's own body limit before Zod can validate.
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
      }
    ]
  }
};

export default nextConfig;
