# ventasfix-api

Backend de VentasFix: Next.js (App Router) usado únicamente como servidor
de rutas (`src/app/api/**/route.ts`), sin páginas ni vistas. Ver
[`../../docs/STACK.md`](../../docs/STACK.md) para el detalle de arquitectura.

## Requisitos

- Node.js 20+
- npm

## Puesta en marcha

```bash
npm install          # instala dependencias y corre `prisma generate` (postinstall)
npm run db:push       # crea/sincroniza prisma/dev.db (SQLite) con schema.prisma
npm run dev           # levanta la API en http://localhost:3001
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar si es necesario:

| Variable       | Uso                                          |
|----------------|-----------------------------------------------|
| `DATABASE_URL` | Cadena de conexión SQLite para Prisma          |
| `PORT`         | Puerto documentado de la API (script usa 3001) |
| `JWT_SECRET`   | Secreto para firmar JWT (aún no implementado)  |

## Verificar que el stack funciona

Con el servidor corriendo:

```bash
curl http://localhost:3001/api/health
# {"status":"ok","db":"ok","timestamp":"..."}
```

Esto confirma que Next.js responde y que Prisma puede consultar la base
SQLite. `db: "error"` con status 503 indica que Prisma no pudo conectar.

## Estado

Bootstrap mínimo: Next.js + TypeScript + Prisma + SQLite conectados y
verificados vía `/api/health`. Sin modelos de dominio, autenticación ni
CRUD todavía — eso corresponde a la siguiente fase (ver `docs/BRIEF.md`).
