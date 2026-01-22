/** @type {import('next').NextConfig} */
// Force Vercel Sync v3

const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'source.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // PWA Support
  reactStrictMode: true,
}

module.exports = nextConfig
