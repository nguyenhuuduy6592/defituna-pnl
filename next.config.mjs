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
  dest: 'public', // RESTORED: Ensure SW is output to public directory
  // disable: process.env.NODE_ENV === 'development', // Keep REMOVED
  swSrc: 'src/service-worker/index.js',
  // swDest: 'public/service-worker.js', // Keep REMOVED (dest handles this)
  register: true, // Keep registration enabled
  skipWaiting: true,
  // runtimeCaching: [], // Keep REMOVED
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
