import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    // Configure loaders if needed
  },

  // Enable experimental features
  experimental: {
    // Partial Prerendering (chỉ available trong canary, tắt cho stable version)
    // ppr: true,
    // React Compiler (optional - uncomment nếu muốn dùng)
    // reactCompiler: true,
  },

  // Performance optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Note: Next 15 uses SWC internally and Turbopack for dev; avoid deprecated swcMinify in config.

  // Enable compression
  compress: true,

  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webpack: (config: any) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bundleAnalyzer = require('@next/bundle-analyzer')
      config.plugins.push(
        new (bundleAnalyzer())({
          enabled: true,
        })
      )
      return config
    },
  }),
}

export default nextConfig
