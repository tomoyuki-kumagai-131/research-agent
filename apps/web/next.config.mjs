/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@research-agent/shared"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};
export default nextConfig;
