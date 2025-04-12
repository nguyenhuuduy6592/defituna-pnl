import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    modules: true,
  },
  experimental: {
    turbo: {
      enabled: false // Disable Turbopack to allow service worker
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
  swSrc: 'src/service-worker/index.js',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
