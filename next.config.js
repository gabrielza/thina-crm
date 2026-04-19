/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "framer-motion"],
  },
  transpilePackages: ["@react-pdf/renderer"],
};

module.exports = nextConfig;
