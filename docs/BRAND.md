# BRAND.md — Identidad visual VentasFix

## 1. Concepto
VentasFix es un backoffice B2B serio y funcional (no es un e-commerce
consumer). La identidad debe transmitir confianza, orden y control de
inventario — no "producto de consumo", sino herramienta de trabajo diaria
para operadores internos.

## 2. Paleta de colores

| Uso                  | Color        | Hex       |
|-----------------------|--------------|-----------|
| Primario (marca)      | Azul marino  | `#1E3A5F` |
| Primario hover        | Azul medio   | `#2C5282` |
| Acento / acciones     | Teal         | `#0D9488` |
| Éxito                 | Verde        | `#16A34A` |
| Info / stock alto     | Celeste      | `#0EA5E9` |
| Alerta / stock bajo   | Rojo         | `#DC2626` |
| Advertencia           | Ámbar        | `#D97706` |
| Fondo app             | Gris muy claro | `#F5F6F8` |
| Superficie (cards)    | Blanco       | `#FFFFFF` |
| Texto principal       | Gris oscuro  | `#1F2937` |
| Texto secundario      | Gris medio   | `#6B7280` |
| Bordes                | Gris claro   | `#E5E7EB` |

Mapeo directo a variables Bootstrap 5 (`_variables.scss` o CSS vars):
`--bs-primary`, `--bs-success`, `--bs-danger`, `--bs-warning`, `--bs-info`.

Contraste mínimo AA (WCAG) verificado para los pares texto/fondo de uso
frecuente: texto principal `#1F2937` sobre `#FFFFFF`/`#F5F6F8`, y texto
blanco sobre `--bs-primary`/`--bs-danger`/`--bs-success`. `--bs-info`
(`#0EA5E9`) es demasiado claro para texto blanco (falla AA); usa texto
oscuro (`#1F2937`) sobre `--bs-info`, igual que el `badge`/`text-bg-info`
por defecto de Bootstrap 5.

## 3. Semántica de estado de stock
- `stock_bajo` → badge rojo (`danger`), texto blanco
- `normal` → badge verde (`success`), texto blanco
- `stock_alto` → badge celeste (`info`), texto oscuro (ver nota de
  contraste en sección 2)
Esto se usa consistentemente en tabla de productos y dashboard.

## 4. Tipografía
- Familia: **Inter** (o system-ui como fallback), vía Google Fonts o
  self-hosted.
- Tamaños: base 16px, h1 28px/700, h2 22px/600, h3 18px/600, body 14-16px,
  small/labels 12-13px.
- Números (precios, stock, contadores del dashboard) en tabular-nums para
  que se alineen en tablas.

## 5. Componentes (sobre Bootstrap 5)
- Sidebar fijo a la izquierda con navegación: Dashboard, Usuarios,
  Productos, Clientes. Header superior con nombre de usuario logueado y
  botón de logout.
- Cards de KPI en el dashboard: 3 cards (Usuarios / Productos / Clientes)
  con número grande + ícono + label.
- Tablas de listado: hover en filas, paginación simple, buscador arriba a
  la derecha, botón "+ Nuevo" arriba a la izquierda.
- Formularios: `Bootstrap` form-floating labels, validación inline con
  Zod (mensajes de error en rojo bajo el campo).
- Botones: primario = azul marino, destructivo (eliminar) = outline rojo
  con confirmación (modal).
- Login: card centrada, fondo simple, logo arriba, sin sidebar.

## 6. Iconografía
- Bootstrap Icons (ya viene con Bootstrap 5, cero dependencias nuevas).
- Usuarios: `bi-people`, Productos: `bi-box-seam`, Clientes:
  `bi-building`, Dashboard: `bi-speedometer2`.

## 7. Tono de copy (UI en español)
- Formal pero directo, sin tecnicismos: "Guardar cambios", no "Submit".
- Mensajes de error concretos: "El email debe terminar en @ventasfix.cl",
  no "Invalid input".
- Confirmaciones de eliminar siempre explícitas: "¿Eliminar producto
  [nombre]? Esta acción no se puede deshacer."

## 8. Estados de interfaz
- Vacío: cuando un listado no tiene registros, mensaje + ícono atenuado
  (ej. "No hay productos registrados" + `bi-box-seam`) en vez de una
  tabla vacía.
- Carga: `spinner-border` de Bootstrap en botones de submit y en
  listados mientras se espera la respuesta de la API.
- Notificaciones: `toast` de Bootstrap arriba a la derecha para
  confirmar create/update/delete exitosos (verde) y errores de API
  (rojo), auto-dismiss ~4s.
- Errores de servidor no ligados a un campo (ej. 500): `alert-danger`
  sobre el formulario; los de validación de campo van inline (ver
  sección 5).

## 9. Formato de datos y responsive
- Locale `es-CL`: precios en CLP vía `Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP' })` (sin decimales); fechas vía
  `Intl.DateTimeFormat('es-CL')`.
- RUT se muestra formateado con puntos y guion (`12.345.678-9`) en
  tablas y detalle; se valida/almacena sin formato.
- Sidebar fijo en desktop (breakpoint `lg` y superior); colapsa a
  `offcanvas` de Bootstrap 5 con botón hamburguesa en el header en
  mobile/tablet — sin componente adicional.
- Carga de imagen de producto: `input type="file"` con estilo
  Bootstrap (`form-control`), preview de la imagen seleccionada antes
  de subir; subir una nueva reemplaza la anterior (una sola imagen por
  producto).
- Paginación: componente `pagination` de Bootstrap, 20 registros por
  página por defecto.

## 10. Modo oscuro
Fuera de alcance para este entregable — no es requisito del enunciado ni
de la rúbrica; no vale la pena que el agente invierta tiempo ahí.

## 11. Logo / nombre
Sin diseño de logo real; usar texto "VentasFix" en la tipografía definida,
peso 700, color primario, como placeholder de marca en sidebar/login.