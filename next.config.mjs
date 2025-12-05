import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    modules: true,
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
  webpack: (config) => {
    // Enable async Wasm loading for all bundles (client + server)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    // Flag .wasm files as async Wasm modules (prevents parse errors)
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Suppress the specific WebAssembly async/await warning
    config.ignoreWarnings = [
      { module: /orca_whirlpools_core_js_bindings_bg\.wasm$/ }
    ];

    return config;
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
