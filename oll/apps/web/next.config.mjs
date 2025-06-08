/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  eslint: {
    ignoreDuringBuilds: true, // Prevents lint errors from blocking build
  },
};

export default nextConfig;
