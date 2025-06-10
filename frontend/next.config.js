/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: false,
  // Use a more compatible output mode
  output: 'export',
  // Disable image optimization since we're using static export
  images: {
    unoptimized: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    // Handled in the CI pipeline
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    // Handled in the CI pipeline
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Add aliases for ScrollSmoother to use our compatibility layer
    config.resolve.alias = {
      ...config.resolve.alias,
      'gsap/ScrollSmoother': path.resolve(__dirname, 'src/lib/gsap/scrollSmoother.ts'),
      'gsap/dist/ScrollSmoother': path.resolve(__dirname, 'src/lib/gsap/scrollSmoother.ts'),
      'gsap/src/ScrollSmoother': path.resolve(__dirname, 'src/lib/gsap/scrollSmoother.ts'),
      'gsap-trial/ScrollSmoother': path.resolve(__dirname, 'src/lib/gsap/scrollSmoother.ts'),
      'gsap-trial/dist/ScrollSmoother': path.resolve(__dirname, 'src/lib/gsap/scrollSmoother.ts'),
      'gsap-trial/src/ScrollSmoother': path.resolve(__dirname, 'src/lib/gsap/scrollSmoother.ts'),
    };
    // Add fallbacks for Node.js modules
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
