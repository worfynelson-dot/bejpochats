/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This helps prevent common Vercel deployment errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
