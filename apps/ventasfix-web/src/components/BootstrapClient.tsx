"use client";

import { useEffect } from "react";

// Carga el JS de Bootstrap (offcanvas, dropdown, etc.) solo en el cliente.
// Next.js renderiza en servidor; el bundle de Bootstrap toca `window` al
// evaluarse, así que no puede importarse de forma estática arriba del árbol.
export default function BootstrapClient() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}
