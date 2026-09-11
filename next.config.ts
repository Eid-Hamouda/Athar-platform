import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Beneficiary/needs donation photos — Supabase Storage public buckets.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Donation photos from the Athar Express backend — uploaded to Cloudinary
      // (backend/src/config/cloudinary.ts).
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
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
