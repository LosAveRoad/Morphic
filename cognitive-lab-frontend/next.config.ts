import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@tldraw/tldraw'],
  },
}

export default nextConfig
