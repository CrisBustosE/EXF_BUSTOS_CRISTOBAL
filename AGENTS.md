# AGENTS.md

Proyecto: **VentasFix** — software de ventas online y gestión de stock.

Antes de tocar código, lee:

- [`docs/BRIEF.md`](docs/BRIEF.md) — qué se construye: dominio, alcance, reglas de negocio.
- [`docs/STACK.md`](docs/STACK.md) — con qué se construye: arquitectura, frameworks, autenticación.
- [`docs/BRAND.md`](docs/BRAND.md) — cómo se ve: colores, tipografía, componentes, copy.

Estos tres documentos son la fuente de verdad del proyecto. Ante cualquier
duda de alcance, stack o diseño, priman sobre suposiciones.

## Estado actual

**Backend (`ventasfix-api`) — cerrado y verificado**: CRUD completo de
Usuario, Producto (incluye subida de imagen) y Cliente; auth
(`POST /api/auth/login` con JWT); `GET /api/dashboard` (conteos por
entidad); documentación OpenAPI autogenerada desde los mismos schemas Zod
(`/api/docs`, `/api/openapi.json`).

**Frontend (`ventasfix-web`) — cerrado y verificado**: BFF de
login/logout, layout protegido (sidebar + offcanvas + header), dashboard
con KPIs, mantenedor de Usuario (listar/crear/editar/eliminar), mantenedor
de Producto (listar/crear/editar/eliminar + subida de imagen).

**Falta**:

- Mantenedor de Cliente en el frontend — el backend ya está completo
  (`apps/ventasfix-api/src/lib/clientes.ts` + rutas REST), solo falta la
  vista; replicar el patrón de Producto/Usuario (ver "Patrones
  establecidos" abajo).
- Extensión opcional de Venta/DetalleVenta (ver `docs/BRIEF.md` secciones
  3.4/3.5) — no arrancada, ni backend ni frontend.

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

## Patrones establecidos (replicar, no reinventar)

- **Estructura por vertical de frontend**: `page.tsx` (fetch server-side
  inicial) + `<Entidad>View.tsx` (client: tabla, paginación, búsqueda,
  estado) + `<Entidad>Form.tsx` (client: modal de alta/edición, con schema
  Zod propio que espeja al de la API). Ver `usuarios/` y `productos/` como
  referencia antes de escribir `clientes/`.
- **BFF**: el browser nunca llama a `ventasfix-api` directo. Cada ruta
  `app/api/<entidad>/**` en `ventasfix-web` reenvía con el JWT de la
  cookie de sesión vía `forwardToApi`/`forwardMultipartToApi`
  (`src/lib/api-proxy.ts`). Excepción: páginas SSR que hacen fetch
  servidor-a-servidor directo contra `ventasfix-api` (dashboard, listas
  iniciales en `page.tsx`).
- **Componentes genéricos reutilizables**: `EntityModal`,
  `ConfirmDeleteModal`, `Toast` ya existen — usarlos en cualquier
  vertical nueva en vez de crear modales/toasts ad hoc.
- **Ciclo de trabajo por vertical chica**: plan corto → confirmación
  explícita del usuario → implementar → smoke test real (curl/Postman-
  equivalente y navegador; nunca fabricar verificación) → commit(s) en
  Conventional Commits en inglés → rama `feature/<area>-<entidad>` (ej.
  `feature/web-producto`, `feature/api-dashboard`) → PR → merge a `main`
  vía `gh`, siempre a pedido explícito del usuario en cada paso.

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
- **`--webpack` en vez de Turbopack para `ventasfix-web`** (scripts
  `dev`/`build` de su `package.json`): Next.js 16 + Turbopack en Windows
  no resuelve los `@import` relativos internos de
  `node_modules/bootstrap/scss/**` al compilar Sass (bug abierto,
  [vercel/next.js#86431](https://github.com/vercel/next.js/issues/86431)).
  `ventasfix-api` no se ve afectado y sigue con Turbopack (no usa Sass).
  Detalle completo en `docs/STACK.md` sección 2.
- **Bootstrap compilado desde Sass propio**
  (`src/app/bootstrap-custom.scss`), no el CSS pre-compilado de `dist/`:
  los componentes de Bootstrap 5.3 (`.btn-primary`, `.badge`, `.alert-*`,
  focus rings, etc.) fijan sus valores en tiempo de compilación Sass a
  partir de `$primary`/etc. — solo las utilidades leen `var(--bs-*)` en
  runtime. Sobreescribir `--bs-primary` en `:root` sin recompilar solo
  pinta las utilidades, no los componentes, y no heredan los colores de
  `BRAND.md`. Detalle completo en `docs/STACK.md` sección 2.
- **Límite explícito de longitud/rango en todo campo numérico o de texto,
  no alcanza con el tipo de dato**: los `Int` de Prisma/SQLite son Int32 y
  crashean con un 500 crudo cerca de ~2.147M sin `.max()` en Zod; un
  `<input type="number">` vacía su `.value` silenciosamente ante
  contenido inválido, así que "vacío" e "inválido" se vuelven
  indistinguibles (usar `type="text"` + `inputMode`, validación real en
  Zod). Todo campo de texto libre también necesita `.max()` explícito o
  rompe el layout de tablas (ver `ProductosView.tsx`: `table-layout:
  fixed` + `text-truncate`).
- **Password opcional en `PUT /api/usuarios/:id` sin corromper el hash**:
  `usuarioUpdateSchema` (en `usuarios.ts`) extiende el schema de creación
  con `password` opcional; vacío/ausente en el update significa "no
  cambiar la contraseña" — nunca hashear un string vacío ni pisar el hash
  existente con `undefined`.
- **`src/lib/rut.ts` está duplicado a propósito entre ambas apps** (mismo
  algoritmo de dígito verificador chileno en `ventasfix-api` y
  `ventasfix-web`): es un monorepo sin workspaces (mandato de
  `STACK.md`), no hay forma de compartir código entre apps sin agregar
  infraestructura de workspace que el stack no pide. Si se toca la
  lógica del RUT, actualizar los dos archivos.

## Datos de prueba

Los datos que hoy existen en `apps/ventasfix-api/prisma/dev.db` (usuarios,
productos y clientes creados durante desarrollo y smoke testing manual)
son de desarrollo/testing, **no son los definitivos**. Antes de armar el
README final con datos de ejemplo presentables hay que resetear la base
(borrar `dev.db`, volver a correr `npm run db:push` y el seed) y cargar
datos limpios y representativos.
