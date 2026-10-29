import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los tests E2E usan su propia carpeta para no pisarse con un `npm run dev` abierto.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
