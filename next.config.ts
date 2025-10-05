import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  output: 'standalone', // For Docker deployment
  // External packages for server components
  serverExternalPackages: ['typeorm', 'pg'],

  // Transpile packages that need to be processed
  transpilePackages: ['recharts'],

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration to preserve class names for TypeORM entities
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Disable minification for server bundles to preserve entity class names
      config.optimization = {
        ...config.optimization,
        minimize: false,
      };
    }
    return config;
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for production
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/manager-dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
