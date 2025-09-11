import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  webpack: (config) => {
    config.externals.push({
      '@prisma/client': '@prisma/client',
      'bcryptjs': 'bcryptjs'
    });
    return config;
  }
};

export default nextConfig;
