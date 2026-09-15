# Stack y Arquitectura

## 1. Arquitectura general

- Patrón **cliente-servidor** con dos aplicaciones **Next.js**
  independientes: `ventasfix-web` (frontend) y `ventasfix-api` (backend),
  cada una con su propio `package.json`, dependencias y ciclo de
  despliegue.
- `ventasfix-api` es un proyecto Next.js usado únicamente como **servidor
  de rutas** (`app/api/...`): no tiene vistas/páginas, solo endpoints que
  devuelven JSON. Se elige Next.js aquí por reutilizar el mismo
  framework/tooling que el frontend (una herramienta menos que aprender y
  mantener), no porque se necesite SSR de páginas en el backend.
- `ventasfix-web` consume `ventasfix-api` por HTTP; no tiene acceso
  directo a la base de datos ni implementa lógica de negocio, solo UI/UX
  y el BFF de autenticación (ver sección 4).
- **Monorepo sin workspaces**: ambos proyectos viven en un mismo
  repositorio Git por conveniencia (un solo lugar para código y
  documentación), pero no comparten `node_modules` ni usan `npm/pnpm
  workspaces`. Cada carpeta se instala y ejecuta por separado.
- La API es la única fuente de verdad del dominio (**API first**, según
  `BRIEF.md`): todo el CRUD, la validación con Zod, el ORM con Prisma y la
  autenticación de negocio viven en `ventasfix-api`.

### Estructura de carpetas

```
apps/
  ventasfix-web/          # frontend — Next.js App Router
    src/app/...
    middleware.ts         # verifica sesión (JWT en cookie httpOnly)
  ventasfix-api/          # backend — Next.js App Router, solo API
    src/app/api/...
AGENTS.md
README.md
docs/
  BRIEF.md
  STACK.md
```

## 2. Stack Frontend (`ventasfix-web`)

- **TypeScript**
- **Next.js (App Router)** — framework de React; server components y
  route handlers se usan para servir las vistas y para el BFF de login
  (`app/api/login/route.ts`), nunca para lógica de negocio de dominio ni
  acceso a base de datos (eso vive en `ventasfix-api`).
- **Bootstrap 5** — estilos y componentes UI.
- **Zod** — validación de formularios en el cliente (misma librería que el
  backend, evita aprender dos sintaxis de validación distintas).
- **Zustand** — estado de UI/cliente que **no sea** la sesión de
  autenticación (ej. estado de formularios, futura funcionalidad de
  venta). La sesión vive en la cookie httpOnly, no en Zustand ni en
  localStorage.

## 3. Stack Backend (`ventasfix-api`)

- **TypeScript**
- **Next.js (App Router)** — usado exclusivamente como servidor de rutas:
  cada `app/api/**/route.ts` expone JSON puro, sin páginas ni vistas.
  Reemplaza a Express: un solo framework para todo el proyecto (frontend
  y backend), sin sumar una dependencia de servidor HTTP aparte.
- **Zod** — validación de entrada en cada route handler (body/params/
  query). Ningún método de escritura (crear, actualizar) acepta datos que
  no pasen el schema; los campos de dominio marcados como obligatorios en
  `BRIEF.md` son `required` en el schema correspondiente, así que no es
  posible persistir registros con campos vacíos.
- **Prisma (ORM)** — modelos, migraciones y acceso a datos.
- **SQLite** — motor de base de datos (suficiente para el alcance del
  proyecto; Prisma permite migrar a Postgres/MySQL cambiando solo el
  `datasource` si el proyecto crece).
- **Sin CORS**: todas las llamadas de negocio (productos, usuarios,
  clientes, dashboard) desde `ventasfix-web` hacia `ventasfix-api` ocurren
  server-to-server, dentro de route handlers propios del frontend
  (ej. `app/api/productos/route.ts`) que reenvían la petición adjuntando
  el JWT desde la cookie httpOnly. Ningún componente cliente hace
  `fetch()` directo a `ventasfix-api` desde el navegador, así que CORS no
  aplica: la política de CORS solo la impone el navegador sobre llamadas
  cross-origin hechas desde JavaScript de cliente, y este proyecto no
  tiene ninguna. Herramientas como Postman tampoco están sujetas a CORS
  (no son navegadores), por lo que las pruebas directas a `ventasfix-api`
  se validan únicamente contra la autenticación JWT de cada endpoint, no
  contra CORS.

## 4. Seguridad y autenticación

- **argon2** — hash de contraseñas (nunca se almacena ni se loguea texto
  plano).
- **jose** — firma del JWT en `ventasfix-api` y verificación del JWT en
  `ventasfix-web` (compatible con Edge Runtime).
- Flujo de autenticación tipo **BFF** (no Bearer token en el navegador):
  1. El navegador hace login contra una route handler propia del
     frontend: `app/api/login/route.ts`.
  2. Esa route handler reenvía las credenciales a `ventasfix-api`, que las
     valida y responde con un JWT firmado (jose).
  3. `ventasfix-web` recibe ese JWT en el servidor y lo setea como cookie
     **httpOnly**, **secure** (en producción) y **sameSite: 'lax'** en la
     respuesta al navegador. El JWT nunca viaja en el body de la
     respuesta al navegador ni se guarda en localStorage/estado de
     cliente (Zustand).
- `middleware.ts` en la raíz de `ventasfix-web` verifica el JWT (con jose,
  en Edge Runtime) leyendo la cookie httpOnly en cada request; protege las
  rutas de los mantenedores (usuarios, productos, clientes) y el
  dashboard, redirigiendo a `/login` si no hay un token válido.
- `ventasfix-api` sigue exigiendo su propio JWT válido (enviado por el
  BFF, nunca directo desde el navegador) en todo endpoint que no sea
  login; lo valida una función compartida invocada al inicio de cada
  route handler protegido.

## 5. Documentación de API

- **OpenAPI**, generado a partir de los mismos schemas de **Zod** ya
  definidos para la validación (`zod-to-openapi` o equivalente), evitando
  mantener dos definiciones (validación y documentación) por separado.

## 6. Testing y calidad

- **Vitest** como único test runner para frontend y backend (un solo
  runner, una sola config, en vez de Jest + otra herramienta).
- **ESLint + Prettier** para lint y formato, uno por proyecto (frontend usa
  la config que trae Next.js por defecto).

## 7. Configuración de entorno

- Variables de entorno vía archivo `.env` por proyecto, cargado con el
  mecanismo nativo de Next.js en ambas apps (`ventasfix-web` y
  `ventasfix-api`); sin dependencias adicionales (ej. `dotenv`).
- Mínimas variables en `ventasfix-api`: `DATABASE_URL` (Prisma/SQLite),
  `JWT_SECRET`, `PORT`.
- Mínimas variables en `ventasfix-web`: `API_URL` (para que el BFF llame a
  `ventasfix-api`), `JWT_SECRET` (mismo valor que en `ventasfix-api`: lo
  necesita `middleware.ts` para verificar el JWT con jose localmente, sin
  ir a la red en cada request).
