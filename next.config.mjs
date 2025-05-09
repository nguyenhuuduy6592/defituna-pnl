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
  images: {
    remotePatterns: [
      { hostname: 'static.jup.ag', protocol: 'https' }, // Jupiter token logos
      { hostname: 'raw.githubusercontent.com', protocol: 'https' }, // Common token logos source
      { hostname: 'arweave.net', protocol: 'https' }, // Arweave-hosted token logos
      { hostname: 'shdw-drive.genesysgo.net', protocol: 'https' }, // Shadow drive hosted logos
      { hostname: 'metadata.jup.ag', protocol: 'https' }, // Jupiter metadata
      { hostname: 'ipfs.io', protocol: 'https' }, // IPFS gateway
      { hostname: 'cloudflare-ipfs.com', protocol: 'https' }, // Cloudflare IPFS gateway (backup)
      { hostname: 'bridge.mogcoin.com', protocol: 'https' }, // MOG token logo
      { hostname: 'www.circle.com', protocol: 'https' }, // Circle (EURC) token logo
      { hostname: 'boop.fun', protocol: 'https' }, // BOOP token logo
      { hostname: 'storage.googleapis.com', protocol: 'https' }, // Google Cloud Storage (JitoSOL and others)
      { hostname: 'cdn.kamino.finance', protocol: 'https' }, // Kamino token logos
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
