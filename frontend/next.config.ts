import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone is for Docker/Railway frontend builds only
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
