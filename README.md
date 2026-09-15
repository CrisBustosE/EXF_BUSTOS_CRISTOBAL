# VentasFix

Software de ventas online y gestión de stock. Dos aplicaciones Next.js
independientes (ver [`docs/STACK.md`](docs/STACK.md)):

- **`apps/ventasfix-api`** — backend, solo servidor de rutas (`app/api/**`),
  Prisma + SQLite.
- **`apps/ventasfix-web`** — frontend, Next.js + Bootstrap 5, consume la API
  server-to-server.

Cada app tiene su propio `package.json` y sus propias dependencias; no son
npm/pnpm workspaces (se instalan por separado). El `package.json` de la
raíz no declara dependencias del proyecto: solo orquesta correr ambas
apps en paralelo con un comando (`concurrently`).

## Puesta en marcha rápida

Primera vez (una sola terminal, instala cada app y crea la base local):

```bash
npm install                                  # instala el orquestador de la raíz
npm install --prefix apps/ventasfix-api
npm install --prefix apps/ventasfix-web
npm run db:push --prefix apps/ventasfix-api  # crea prisma/dev.db
```

Luego, para levantar ambas apps con un solo comando:

```bash
npm run dev
```

Esto corre `ventasfix-api` en `http://localhost:3001` y `ventasfix-web`
en `http://localhost:3000` en paralelo (salida con prefijo `[api]`/`[web]`);
`Ctrl+C` detiene ambas. También se pueden correr por separado, cada una
en su propia terminal, con `npm run dev` dentro de `apps/ventasfix-api` y
`apps/ventasfix-web`.

Abrir `http://localhost:3000`: la página muestra el estado de ambas
aplicaciones y de la base de datos, confirmando que el stack completo
(Next.js × 2, Prisma, SQLite, Bootstrap 5, conectividad HTTP entre apps)
funciona de punta a punta.

Detalles de configuración y variables de entorno en el README de cada
app: [`apps/ventasfix-api/README.md`](apps/ventasfix-api/README.md),
[`apps/ventasfix-web/README.md`](apps/ventasfix-web/README.md).

## Estado del proyecto

Bootstrap inicial de ambas apps con el stack mínimo funcionando (sin
modelos de dominio, autenticación ni CRUD). Alcance completo y reglas de
negocio en [`docs/BRIEF.md`](docs/BRIEF.md).
