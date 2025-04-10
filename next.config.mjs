import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    modules: true,
  },
  experimental: {
    turbo: {
      enabled: true // Enable Turbopack
    }
  },
  headers: async () => [
    {
      source: '/service-worker.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ],
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [],
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
