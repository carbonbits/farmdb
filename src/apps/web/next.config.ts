import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  transpilePackages: ["@farmdb/ui", "@farmdb/api-client"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
