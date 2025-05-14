const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  exclude: [
    /\.map$/,
    /asset-manifest\.json$/,
    /icons\/.*\.png$/,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true, // Good for static exports
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mkhekxkxoybmivuagoxf.supabase.co",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
