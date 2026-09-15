# AGENTS.md

Proyecto: **VentasFix** — software de ventas online y gestión de stock.

Antes de tocar código, lee:

- [`docs/BRIEF.md`](docs/BRIEF.md) — qué se construye: dominio, alcance, reglas de negocio.
- [`docs/STACK.md`](docs/STACK.md) — con qué se construye: arquitectura, frameworks, autenticación.
- [`docs/BRAND.md`](docs/BRAND.md) — cómo se ve: colores, tipografía, componentes, copy.

Estos tres documentos son la fuente de verdad del proyecto. Ante cualquier
duda de alcance, stack o diseño, priman sobre suposiciones.

## Estado actual

Bootstrap mínimo funcionando: `apps/ventasfix-api` (Next.js headless +
Prisma + SQLite) y `apps/ventasfix-web` (Next.js + Bootstrap 5) creados,
conectados entre sí (`GET /api/health`) y verificados de punta a punta.
Sin modelos de dominio, autenticación ni CRUD todavía — eso es la
siguiente fase (ver `docs/BRIEF.md`).

## Cómo correr el proyecto

```bash
npm install                                  # orquestador de la raíz (concurrently)
npm install --prefix apps/ventasfix-api
npm install --prefix apps/ventasfix-web
npm run db:push --prefix apps/ventasfix-api  # crea apps/ventasfix-api/prisma/dev.db
npm run dev                                  # levanta api (3001) y web (3000) juntas
```

Detalle de variables de entorno y arranque por separado en el README de
cada app (`apps/ventasfix-api/README.md`, `apps/ventasfix-web/README.md`)
y en el README raíz.

## Decisiones técnicas y gotchas (no repetir)

- **Monorepo sin workspaces** (mandato de `STACK.md`): cada app tiene su
  propio `node_modules`/`package-lock.json`, se instalan por separado. El
  `package.json` de la raíz **no** declara `workspaces`; solo trae
  `concurrently` como devDependency para orquestar `npm run dev`.
- **Orquestación con `cd <dir> && npm run dev`, no `--prefix`**: el script
  raíz usa `concurrently "cd apps/ventasfix-api && npm run dev" "cd
  apps/ventasfix-web && npm run dev"`. Se probó `npm run dev --prefix
  <dir>` primero y de forma intermitente el `cwd` del proceso `next dev`
  hijo no se relocaba (anidado dentro de `concurrently` en Windows),
  generando un `.next` fantasma en la raíz del repo. `cd &&` fija el cwd
  de forma explícita y es determinista en Windows y POSIX.
- **Prisma: generator `prisma-client-js`, no `prisma-client`**. `prisma
  init` en Prisma 6.19 crea por defecto el generator nuevo
  `"prisma-client"` con `output` custom (`src/generated/prisma`). Ese
  generator resuelve la URL relativa de SQLite (`file:./dev.db`) de forma
  distinta en la CLI (`prisma db push`/`generate`, relativa a
  `schema.prisma`) que en runtime (`next dev`/`next start`), y falla con
  `Error code 14: Unable to open the database file` incluso pasando un
  path absoluto vía `datasourceUrl`. `apps/ventasfix-api/prisma/schema.prisma`
  usa el generator clásico `prisma-client-js` (salida en
  `node_modules/@prisma/client`), que sí resuelve el path de forma
  consistente. No volver al generator `prisma-client` sin resolver esto.
- **Puertos fijos**: `ventasfix-api` en `3001`, `ventasfix-web` en `3000`
  (hardcodeados en el script `dev`/`start` de cada `package.json`, no vía
  `PORT` env porque `next dev` no lo respeta de forma consistente entre
  plataformas). El `.env` de cada app documenta `PORT`/`API_URL` como
  contrato, pero quien controla el puerto real es el flag `-p` del script.
