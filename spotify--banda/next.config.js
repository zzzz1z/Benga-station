/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mkhekxkxoybmivuagoxf.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/youtube/stream',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;