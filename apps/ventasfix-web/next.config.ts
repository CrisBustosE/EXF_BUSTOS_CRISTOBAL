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
    // Silencia deprecation warnings que vienen del código fuente de
    // Bootstrap 5 (@import clásico, que Dart Sass recién elimina en su
    // v3.0) — no de nuestro bootstrap-custom.scss. `quietDeps` filtra
    // por origen (node_modules), no por tipo de warning, así que
    // seguimos viendo cualquier deprecación real en nuestro propio Sass.
    quietDeps: true,
  },
  async headers() {
    return [
      {
        source: "/((?!login|api/).*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
