import { NextResponse } from "next/server";

const html = `<!doctype html>
<html lang="es">
  <head>
    <title>VentasFix API — Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', { url: '/api/openapi.json' });
    </script>
  </body>
</html>`;

// Público a propósito: es documentación, no datos de negocio.
export async function GET() {
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
