/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // In production, set NEXT_PUBLIC_API_URL in your hosting platform
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  async rewrites() {
    // Proxy /api to backend only in development (e.g. for single-ngrok testing)
    if (process.env.NODE_ENV === 'development') {
      return [
        { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
      ];
    }
    return [];
  },
}

module.exports = nextConfig










