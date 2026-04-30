/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:8080/api/v1/:path*',
        },
        {
          source: '/fastapi/:path*',
          destination: 'http://localhost:8000/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
