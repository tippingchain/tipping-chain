/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable static export for GitHub Pages
  output: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'export' : undefined,
  
  // Configure base path for GitHub Pages
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Disable image optimization for static export
  images: {
    unoptimized: process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  },
  
  // Enable trailing slash for better static hosting compatibility
  trailingSlash: true,
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle node modules for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig