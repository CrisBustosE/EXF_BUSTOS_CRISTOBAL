# ventasfix-web

Frontend de VentasFix: Next.js (App Router) + Bootstrap 5. Consume
`ventasfix-api` por HTTP server-to-server (sin llamadas `fetch()` desde el
navegador hacia la API). Ver [`../../docs/STACK.md`](../../docs/STACK.md)
y [`../../docs/BRAND.md`](../../docs/BRAND.md).

## Requisitos

- Node.js 20+
- npm
- `ventasfix-api` corriendo en `http://localhost:3001` (ver su README)

## Puesta en marcha

```bash
npm install
npm run dev   # levanta el frontend en http://localhost:3000
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y ajustar si es necesario:

| Variable       | Uso                                                  |
|----------------|-------------------------------------------------------|
| `API_URL`      | URL base de `ventasfix-api` para las llamadas server-side |
| `JWT_SECRET`   | Mismo valor que en la API, para `middleware.ts` (aún no implementado) |

## Verificar que el stack funciona

Con `ventasfix-api` y `ventasfix-web` corriendo, abrir
`http://localhost:3000`: la página muestra el estado de `ventasfix-web`
(siempre "ok") y de `ventasfix-api` (badge verde "ok" si la API y su base
de datos responden, alerta roja si no). Esto confirma Next.js + Bootstrap
5 + conectividad HTTP hacia la API.

## Estado

Bootstrap mínimo: Next.js + TypeScript + Bootstrap 5, con una página que
verifica la conectividad contra `ventasfix-api`. Sin autenticación (BFF),
Zustand ni vistas de dominio todavía — ver `docs/BRIEF.md` para la
siguiente fase.
