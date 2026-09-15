# VentasFix — Software de Ventas Online y Gestión de Stock

## 1. Contexto y objetivo

VentasFix es una plataforma para la venta online de productos y el control de
inventario asociado. El núcleo del sistema administra usuarios, catálogo de
productos y clientes, y expone un dashboard con indicadores agregados del
negocio. El registro de ventas/pedidos con descuento de stock es una
extensión opcional que se construye una vez que ese núcleo está completo.
Toda la funcionalidad se expone tanto vía API como a través de una interfaz
web (enfoque **API first**).

## 2. Alcance

Incluido:
- Gestión de usuarios internos (autenticación y CRUD).
- Gestión de catálogo de productos y niveles de stock.
- Gestión de clientes (empresas compradoras).
- Dashboard con conteo de usuarios, conteo de productos y conteo de
  clientes, disponible como endpoint de API y como vista en el frontend.
- API REST documentada y vistas web que consuman esa misma API.

Incluido (OPCIONAL, ver nota en sección 3.4): registro de ventas/pedidos
que relacionen usuario, cliente y productos, con descuento de stock.

Fuera de alcance (no se especifica, se asume descartado salvo indicación
contraria): pasarela de pago real, facturación electrónica (SII), múltiples
bodegas/sucursales, roles y permisos granulares.

## 3. Modelo de dominio

### 3.1 Usuario
Personal interno que opera el sistema (no son los clientes).

| Campo      | Tipo         | Reglas |
|------------|--------------|--------|
| id         | PK           | Autoincremental |
| rut        | string       | RUT chileno, único, con validación de dígito verificador |
| nombre     | string       | Requerido |
| apellido   | string       | Requerido |
| email      | string       | Único, usado como *username*; dominio obligatorio `@ventasfix.cl` |
| password   | string       | Requerido; se almacena **hasheada** (nunca en texto plano) |

### 3.2 Producto

| Campo               | Tipo    | Reglas |
|---------------------|---------|--------|
| id                  | PK      | Autoincremental |
| sku                 | string  | Único |
| nombre              | string  | Requerido |
| descripcion_corta   | string  | Requerido |
| descripcion_larga   | text    | Opcional |
| imagen_del_producto | string  | Path/URL de la imagen; una sola imagen por producto (ver mecanismo de carga abajo) |
| precio_neto         | decimal | > 0 |
| precio_de_venta     | decimal | = round(precio_neto * 1.19); calculado automáticamente por el sistema, el usuario nunca lo ingresa directamente; no incluye margen adicional, según el enunciado original del examen (IVA fijo 19%) |
| stock_actual        | int     | >= 0; se descuenta automáticamente al confirmar una venta |
| stock_minimo        | int     | >= 0; cantidad de seguridad que el producto debería mantener (uso interno de reposición) |
| stock_bajo          | int     | >= 0; umbral bajo el cual `stock_actual` se considera **stock bajo** |
| stock_alto          | int     | >= 0; umbral sobre el cual `stock_actual` se considera **stock alto** |

Las 4 columnas de stock (`stock_actual`, `stock_minimo`, `stock_bajo`,
`stock_alto`) se persisten tal como las nombra el enunciado original; no se
reemplazan por un estado calculado. La API sí agrega, además de las 4
columnas, un campo derivado `estado_stock` (`"bajo" | "normal" | "alto"`)
solo en la respuesta JSON, calculado en el momento de la consulta a partir
de `stock_actual` vs. `stock_bajo`/`stock_alto` — nunca se guarda en base
de datos.

#### Carga de imagen

- La API expone un endpoint dedicado (ej. `POST /productos/:id/imagen`)
  que recibe el archivo como `multipart/form-data`.
- El backend guarda el archivo en una carpeta de archivos estáticos del
  proyecto (ej. `apps/backend/public/productos/` o equivalente) con un
  nombre único.
- En la base de datos solo se persiste el path/URL resultante en
  `imagen_del_producto`, nunca el binario de la imagen.

### 3.3 Cliente
Empresa que compra a VentasFix (venta B2B).

| Campo            | Tipo   | Reglas |
|------------------|--------|--------|
| id               | PK     | Autoincremental |
| rut_empresa      | string | RUT chileno de empresa, único |
| rubro            | string | Requerido |
| razon_social     | string | Requerido |
| telefono         | string | Requerido |
| direccion        | string | Requerido |
| nombre_contacto  | string | Requerido |
| email_contacto   | string | Requerido, formato email |

### 3.4 Venta (OPCIONAL — entidad faltante en el brief original, necesaria
para que el sistema sea "de ventas")

> **Decisión de alcance para esta entrega**: se decidió NO implementar
> Venta/DetalleVenta. El enunciado original del examen no la pide, la
> rúbrica no la evalúa, y el tiempo se priorizó en pulir y verificar
> exhaustivamente el núcleo (Usuario, Producto, Cliente, Dashboard,
> Autenticación) en su lugar. Queda documentada como backlog / siguiente
> sprint para una eventual continuación del proyecto.
>
> **Alcance opcional**: Venta y DetalleVenta se implementan solo después de
> tener completos y testeados Usuarios, Productos, Clientes, Dashboard y
> Autenticación. No son parte del entregable mínimo.

| Campo         | Tipo     | Reglas |
|---------------|----------|--------|
| id            | PK       | Autoincremental |
| usuario_id    | FK       | Usuario que registra la venta |
| cliente_id    | FK       | Cliente que compra |
| fecha         | datetime | Autogenerada |
| estado        | string   | `pendiente` / `confirmada` / `anulada` |
| total         | decimal  | Suma de los detalles |

### 3.5 DetalleVenta (OPCIONAL, ver nota en 3.4)

| Campo        | Tipo    | Reglas |
|--------------|---------|--------|
| id           | PK      | Autoincremental |
| venta_id     | FK      | Venta a la que pertenece |
| producto_id  | FK      | Producto vendido |
| cantidad     | int     | > 0; no puede superar `stock_actual` disponible |
| precio_unitario | decimal | Copia de `precio_de_venta` al momento de la venta |
| subtotal     | decimal | `cantidad * precio_unitario` |

## 4. Reglas de negocio

1. El email de un Usuario debe terminar en `@ventasfix.cl`; el sistema
   rechaza el registro/login en caso contrario.
2. (Opcional, ver 3.4) Al confirmar una Venta, se descuenta `cantidad` del
   `stock_actual` de cada producto del detalle; si el stock disponible es
   insuficiente, la venta no se confirma.
3. El campo derivado `estado_stock` de un producto es `"bajo"` cuando
   `stock_actual <= stock_bajo`, `"alto"` cuando `stock_actual >=
   stock_alto`, y `"normal"` en cualquier otro caso; se calcula al
   responder la API, nunca se persiste. Si `stock_bajo` y `stock_alto`
   quedan configurados de forma que ambas condiciones se cumplen a la
   vez (ej. `stock_bajo >= stock_alto`, o `stock_actual` cae justo en
   el valor donde se solapan), `"bajo"` tiene prioridad — se evalúa
   primero en la cadena de condiciones, a propósito: es el resultado
   más conservador (alertar que falta stock antes que celebrar que
   sobra). No es un bug ni un caso que la API rechace; `stock_bajo` y
   `stock_alto` no tienen una regla que los obligue a no solaparse.
4. RUT (de Usuario y de Cliente) se valida con algoritmo de dígito
   verificador chileno antes de persistir.

## 5. Requerimientos funcionales

- CRUD de Usuarios, Productos y Clientes.
- Autenticación de Usuarios (login con email/password).
- Dashboard: endpoint de API y vista en el frontend que exponen conteo
  total de Usuarios, conteo total de Productos y conteo total de Clientes.
- Listado de productos con campo derivado de estado de stock
  (bajo/normal/alto).
- Búsqueda/filtrado de productos (por nombre, sku) y de clientes (por
  razón social, rut).
- (OPCIONAL, ver 3.4) CRUD de Ventas: registro de una Venta con uno o más
  productos y descuento de stock transaccional (todo o nada). Se
  implementa después de que Usuarios, Productos, Clientes, Dashboard y
  Autenticación estén completos y testeados.

## 6. Requerimientos técnicos

- El software debe ser **API first**: toda funcionalidad de negocio se
  implementa primero como API REST, y las vistas web consumen esa API (no
  lógica de negocio duplicada en el frontend).
- Usar un **framework o microframework** de backend (a definir según stack
  del equipo).
- Usar un **ORM** para el acceso a datos (migraciones y modelos, no SQL
  manual salvo casos puntuales).
- Persistencia en base de datos relacional (aplica igual al núcleo
  Usuario/Producto/Cliente; si se implementa la extensión opcional de
  Venta/DetalleVenta, esta añade las llaves foráneas correspondientes).
- Passwords hasheados (ej. bcrypt/argon2), nunca en texto plano ni en logs.
- Manejo de archivos: subida de `imagen_del_producto` vía
  `multipart/form-data`, almacenada en una carpeta de archivos estáticos
  del backend; solo el path/URL se persiste en base de datos.

## 7. Requerimientos no funcionales

- Validación de entrada en todos los endpoints de la API (tipos, campos
  requeridos, formato de RUT/email).
- Manejo consistente de errores en la API (códigos HTTP + mensaje).
- Documentación de la API (ej. OpenAPI/Swagger) para consumo por las vistas
  y por terceros.

## 8. Entregables

- Código fuente del backend (API) y frontend (vistas).
- Scripts/migraciones de base de datos.
- Documentación de la API.
- Instrucciones de instalación y ejecución local (README).

## 9. Datos iniciales (seed)

- El proyecto debe incluir un **seed** que se ejecute en el primer
  arranque (o vía comando, ej. `prisma db seed`) y cree al menos un
  **usuario administrador** con email válido de dominio `@ventasfix.cl` y
  contraseña conocida (definida por variable de entorno o documentada en
  el README), de forma que sea posible iniciar sesión sin pasos manuales
  adicionales.

## 10. Criterios de aceptación

- Un Usuario con email fuera de `@ventasfix.cl` no puede registrarse ni
  iniciar sesión.
- Tras ejecutar el seed, existe al menos un usuario administrador con el
  que se puede iniciar sesión sin pasos manuales adicionales.
- El dashboard (API y vista) muestra el conteo real de Usuarios, Productos
  y Clientes existentes.
- Subir una imagen a un producto persiste solo su path/URL en
  `imagen_del_producto`, y el archivo queda accesible como recurso
  estático servido por el backend.
- Cada entidad del núcleo (Usuario, Producto, Cliente) es accesible vía
  API (CRUD) y vía al menos una vista web equivalente.
- (OPCIONAL) Si se implementa Venta: registrarla descuenta el stock de
  cada producto involucrado, y una Venta que exceda el `stock_actual`
  disponible es rechazada sin modificar el stock.
