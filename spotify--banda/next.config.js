// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  exclude: [
    /\.map$/, // exclude source maps
    /asset-manifest\.json$/,
    /icons\/.*\.png$/,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mkhekxkxoybmivuagoxf.supabase.co",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
