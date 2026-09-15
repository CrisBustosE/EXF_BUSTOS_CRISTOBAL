import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, el bundler infiere la raíz del workspace subiendo hasta el
  // package.json/package-lock.json de orquestación en la raíz del repo
  // (que no tiene `bootstrap` en su node_modules) en vez de esta app.
  turbopack: {
    root: path.join(__dirname),
  },
  sassOptions: {
    implementation: "sass-embedded",
  },
};

export default nextConfig;
