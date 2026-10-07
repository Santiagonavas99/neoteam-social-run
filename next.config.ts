import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Keep in sync with features/home/logo-image.ts.
    remotePatterns: [
      new URL('https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/**'),
    ],
  },
}

export default nextConfig
