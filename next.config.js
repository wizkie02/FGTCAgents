/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'], // Add any other domains you need
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Add other Next.js config options as needed
}

module.exports = nextConfig
