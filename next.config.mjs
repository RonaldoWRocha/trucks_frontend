/** @type {import('next').NextConfig} */
const API_HOST =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://host.docker.internal:80";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_HOST}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
