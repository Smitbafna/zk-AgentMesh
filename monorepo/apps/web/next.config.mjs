/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  eslint: {
    ignoreDuringBuilds: true, // Prevents lint errors from blocking build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ disables type-checking on build
  },
};

export default nextConfig;
