import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, el bundler infiere la raíz del workspace subiendo hasta el
  // package.json/package-lock.json de orquestación en la raíz del repo,
  // emitiendo el warning de "multiple lockfiles" (hay uno ahí y otro acá).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
