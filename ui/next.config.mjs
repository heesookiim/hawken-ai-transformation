/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  // Add proxy configuration for API requests
  async rewrites() {
    // In production mode, proxy API requests to Heroku
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode: Proxying API requests to Heroku');
      return [
        {
          source: '/api/:path*',
          destination: 'https://hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com/api/:path*'
        },
        {
          source: '/cache/:path*',
          destination: 'https://hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com/cache/:path*'
        },
        {
          source: '/test-results/:path*',
          destination: 'https://hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com/test-results/:path*'
        }
      ];
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
  
  // Configuration for server components
  serverExternalPackages: ["mysql2"],
  outputFileTracingRoot: process.cwd(),
  
  // Properly configure images for deployment
  images: {
    domains: [
      "localhost",
      "vercel.app",
      "avatars.githubusercontent.com",
      "*.cloudfront.net",
      "*.amazonaws.com",
      "hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com",
      }
    ],
    unoptimized: process.env.NODE_ENV === 'production', // Disable image optimization in production for Heroku
  },
  
  reactStrictMode: true,
  webpack: (config) => {
    // Add raw-loader for .txt files
    config.module.rules.push({
      test: /\.txt$/,
      use: 'raw-loader'
    });
    
    // @ts-ignore
    config.externals = [...config.externals, "canvas", "jsdom"];
    return config;
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig; 