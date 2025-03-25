/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  // Add proxy configuration for API requests
  async rewrites() {
    // In production mode, we don't need to proxy API requests since they'll be served from the same domain
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // In development mode, proxy requests to the local dev server
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      },
      {
        source: '/cache/:path*',
        destination: 'http://localhost:3001/cache/:path*'
      },
      {
        source: '/test-results/:path*',
        destination: 'http://localhost:3001/test-results/:path*'
      }
    ];
  },

  // Output as standalone to optimize for deployment
  output: 'standalone',
  
  // Configuration for server components (moved from experimental to root config)
  serverExternalPackages: [],
  outputFileTracingRoot: process.cwd(),
  
  // Properly configure images for deployment
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production', // Disable image optimization in production for Heroku
  },
  
  reactStrictMode: true,
  webpack: (config) => {
    // Add raw-loader for .txt files
    config.module.rules.push({
      test: /\.txt$/,
      use: 'raw-loader'
    });
    
    return config;
  },
};

export default nextConfig; 