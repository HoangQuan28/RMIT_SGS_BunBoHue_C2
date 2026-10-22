/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@huggingface/transformers', 'onnxruntime-node'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3', '@huggingface/transformers', 'onnxruntime-node'];
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/tide_dpop/:path*',
        destination: '/tide_dpop_auth.html',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' *",
          },
        ],
      },
      {
        source: '/tide_dpop/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'unsafe-inline'",
          },
          {
            key: 'Allow-CSP-From',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

