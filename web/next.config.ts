import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {hostname: "www.breatheazy.co.uk"}
    ]
  }
};

export default nextConfig;
