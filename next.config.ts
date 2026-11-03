import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev y next build usan carpetas distintas: si comparten .next, correr un
  // build con el servidor de desarrollo levantado rompe a los dos.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
