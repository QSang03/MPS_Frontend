/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a standalone build for smaller Docker runtime images
  output: 'standalone',

  turbopack: {},

  experimental: {},

  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/public/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.117.18',
        port: '3000',
        pathname: '/public/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.117.210',
        port: '3000',
        pathname: '/public/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.117.25',
        port: '3000',
        pathname: '/public/uploads/**',
      },
    ],
  },

  compress: true,

  ...(process.env.ANALYZE === 'true' && {
    webpack: async (config) => {
      const bundleAnalyzer = (await import('@next/bundle-analyzer')).default
      config.plugins.push(
        new (bundleAnalyzer())({
          enabled: true,
        })
      )
      return config
    },
  }),

  async headers() {
    const noStore = {
      key: 'Cache-Control',
      value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    }

    return [
      { source: '/', headers: [noStore] },
      { source: '/login', headers: [noStore] },
      { source: '/system/:path*', headers: [noStore] },
      { source: '/system-admin/:path*', headers: [noStore] },
      { source: '/user/:path*', headers: [noStore] },
      { source: '/403', headers: [noStore] },
      { source: '/404', headers: [noStore] },
    ]
  },
}

module.exports = nextConfig
