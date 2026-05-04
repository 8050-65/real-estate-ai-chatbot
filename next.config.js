/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve static files from frontend/public
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
  // Disable static optimization to serve frontend/public directly
  experimental: {
    optimizePackageImports: ['@nextui-org/react'],
  },
};

module.exports = nextConfig;
