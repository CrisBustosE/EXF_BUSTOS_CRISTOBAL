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
    // `quietDeps` solo cubre lo que bootstrap-custom.scss importa (los
    // .scss dentro de node_modules/bootstrap), no las líneas @import del
    // propio bootstrap-custom.scss — Sass sigue avisando sobre esas dos
    // porque es el archivo "raíz" que se está compilando, no algo que
    // ese archivo arrastra. `silenceDeprecations` filtra por tipo de
    // warning en vez de por origen, así que cubre ambos casos: el mismo
    // @import clásico (que Dart Sass recién elimina en su v3.0) tanto en
    // bootstrap-custom.scss como en lo que importa de Bootstrap.
    silenceDeprecations: ["import"],
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
