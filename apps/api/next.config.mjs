/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared workspace package so Next.js can process its TypeScript
  transpilePackages: ['@workspace/shared'],

  // TypeScript strict mode (build will fail on type errors)
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // Fallback rewrite so that any non-API/non-internal route serves the Vite SPA frontend (index.html in public/)
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/((?!api|_next|_error|404|500|favicon\\.ico).*)',
          destination: '/index.html',
        },
      ],
    };
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
