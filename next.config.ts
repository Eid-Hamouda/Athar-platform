import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Donation photos are served from Supabase Storage public buckets.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Donation photos are posted straight to the vision action.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
