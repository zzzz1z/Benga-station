/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
          {
            source: '/(.*)',
            headers: [
              {
                key: 'Content-Security-Policy',
                value: `
                  default-src 'self';
                  font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
                  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                  script-src 'self' 'nonce-<RANDOM_NONCE>';
                  img-src 'self' data:;
                  connect-src 'self';
                `.replace(/\s{2,}/g, ' ').trim(),
              },
            ],
          },
        ];
      },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'mkhekxkxoybmivuagoxf.supabase.co',
        },
      ],
    },
  };
  
  export default nextConfig;
  