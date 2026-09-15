import { z } from "zod";
import { createDocument, type ZodOpenApiOperationObject } from "zod-openapi";
import { loginSchema } from "@/lib/auth";
import { usuarioInputSchema, usuarioUpdateSchema } from "@/lib/usuarios";
import { productoInputSchema } from "@/lib/productos";
import { clienteInputSchema } from "@/lib/clientes";

// Los schemas de request (arriba) son los MISMOS que usan los route
// handlers para validar con Zod — no hay una definición aparte a mano.
// Los de response se derivan de esos mismos schemas de input agregando
// solo lo que la API añade en la respuesta (id, campos calculados,
// campos que no se aceptan en el body).

// rut/rut_empresa usan .transform() en el schema de input (normalizan el
// formato antes de persistir); zod-openapi no puede representar un
// transform en un schema de salida, así que en la respuesta se declaran
// como string plano — que es exactamente lo que la API devuelve.
const usuarioResponseSchema = usuarioInputSchema.omit({ password: true }).extend({
  id: z.number().int(),
  rut: z.string(),
});

const productoResponseSchema = productoInputSchema.extend({
  id: z.number().int(),
  descripcion_larga: z.string().nullable(),
  // Ya no forma parte del body de request (ver src/lib/productos.ts):
  // se calcula en el servidor a partir de precio_neto, nunca lo envía
  // el cliente. Sigue siendo parte de la respuesta.
  precio_de_venta: z.number(),
  imagen_del_producto: z.string().nullable(),
  estado_stock: z.enum(["bajo", "normal", "alto"]),
});

const clienteResponseSchema = clienteInputSchema.extend({
  id: z.number().int(),
  rut_empresa: z.string(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  issues: z.record(z.string(), z.array(z.string())).optional(),
});

const idParam = { path: z.object({ id: z.string().meta({ description: "Id numérico" }) }) };

const bearerSecurity = [{ bearerAuth: [] }];

function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: errorResponseSchema } },
  };
}

const unauthorized = errorResponse(
  "Falta el header Authorization: Bearer <token>, o el token es inválido/expiró",
);
const badId = errorResponse("El id de la ruta no es un entero válido");

function crudPaths(opts: {
  tag: string;
  base: string; // ej. "/api/usuarios"
  inputSchema: z.ZodType;
  // Solo si el body de PUT difiere del de POST (ej. Usuario: password
  // opcional en update). Por defecto, igual a inputSchema.
  updateSchema?: z.ZodType;
  responseSchema: z.ZodType;
  listItem: string; // nombre singular para descripciones, ej. "usuario"
  conflictDescription: string;
  querySchema?: z.ZodObject<z.ZodRawShape>;
}) {
  const {
    tag,
    base,
    inputSchema,
    updateSchema = inputSchema,
    responseSchema,
    listItem,
    conflictDescription,
    querySchema,
  } = opts;

  const list: ZodOpenApiOperationObject = {
    tags: [tag],
    summary: `Listar ${listItem}s`,
    security: bearerSecurity,
    ...(querySchema ? { requestParams: { query: querySchema } } : {}),
    responses: {
      "200": {
        description: "Lista de registros",
        content: { "application/json": { schema: z.array(responseSchema) } },
      },
      "401": unauthorized,
    },
  };

  const create: ZodOpenApiOperationObject = {
    tags: [tag],
    summary: `Crear ${listItem}`,
    security: bearerSecurity,
    requestBody: { content: { "application/json": { schema: inputSchema } } },
    responses: {
      "201": {
        description: "Creado",
        content: { "application/json": { schema: responseSchema } },
      },
      "400": errorResponse("Body inválido (campo requerido vacío, formato incorrecto, etc.)"),
      "401": unauthorized,
      "409": errorResponse(conflictDescription),
    },
  };

  const get: ZodOpenApiOperationObject = {
    tags: [tag],
    summary: `Obtener ${listItem} por id`,
    security: bearerSecurity,
    requestParams: idParam,
    responses: {
      "200": {
        description: "Encontrado",
        content: { "application/json": { schema: responseSchema } },
      },
      "400": badId,
      "401": unauthorized,
      "404": errorResponse(`No existe un ${listItem} con ese id`),
    },
  };

  const update: ZodOpenApiOperationObject = {
    tags: [tag],
    summary: `Actualizar ${listItem}`,
    security: bearerSecurity,
    requestParams: idParam,
    requestBody: { content: { "application/json": { schema: updateSchema } } },
    responses: {
      "200": {
        description: "Actualizado",
        content: { "application/json": { schema: responseSchema } },
      },
      "400": errorResponse("Body inválido, o el id de la ruta no es un entero válido"),
      "401": unauthorized,
      "404": errorResponse(`No existe un ${listItem} con ese id`),
      "409": errorResponse(conflictDescription),
    },
  };

  const remove: ZodOpenApiOperationObject = {
    tags: [tag],
    summary: `Eliminar ${listItem}`,
    security: bearerSecurity,
    requestParams: idParam,
    responses: {
      "204": { description: "Eliminado" },
      "400": badId,
      "401": unauthorized,
      "404": errorResponse(`No existe un ${listItem} con ese id`),
    },
  };

  return {
    [base]: { get: list, post: create },
    [`${base}/{id}`]: { get, put: update, delete: remove },
  };
}

export function buildOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "VentasFix API",
      version: "1.0.0",
      description:
        "API REST de VentasFix (ventasfix-api). Generada a partir de los mismos schemas Zod que usan los route handlers para validar (ver docs/STACK.md sección 5).",
    },
    servers: [{ url: "/", description: "Servidor actual" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token obtenido de POST /api/auth/login",
        },
      },
    },
    paths: {
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description:
            "Único endpoint sin autenticación. 401 con el mismo mensaje genérico tanto si el email no existe como si la password no coincide (evita enumeration).",
          requestBody: { content: { "application/json": { schema: loginSchema } } },
          responses: {
            "200": {
              description: "Credenciales válidas",
              content: { "application/json": { schema: z.object({ token: z.string() }) } },
            },
            "400": errorResponse("Falta email o password"),
            "401": errorResponse("Email o password incorrectos"),
          },
        },
      },
      "/api/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "Conteo de registros",
          security: bearerSecurity,
          responses: {
            "200": {
              description: "Conteos actuales",
              content: {
                "application/json": {
                  schema: z.object({
                    total_usuarios: z.number().int(),
                    total_productos: z.number().int(),
                    total_clientes: z.number().int(),
                  }),
                },
              },
            },
            "401": unauthorized,
          },
        },
      },
      ...crudPaths({
        tag: "Usuarios",
        base: "/api/usuarios",
        inputSchema: usuarioInputSchema,
        updateSchema: usuarioUpdateSchema,
        responseSchema: usuarioResponseSchema,
        listItem: "usuario",
        conflictDescription: "Ya existe un usuario con ese rut o email",
      }),
      ...crudPaths({
        tag: "Productos",
        base: "/api/productos",
        inputSchema: productoInputSchema,
        responseSchema: productoResponseSchema,
        listItem: "producto",
        conflictDescription: "Ya existe un producto con ese sku",
        querySchema: z.object({
          nombre: z.string().optional().meta({ description: "Filtro contains, case-insensitive" }),
          sku: z.string().optional().meta({ description: "Filtro contains, case-insensitive" }),
        }),
      }),
      ...crudPaths({
        tag: "Clientes",
        base: "/api/clientes",
        inputSchema: clienteInputSchema,
        responseSchema: clienteResponseSchema,
        listItem: "cliente",
        conflictDescription: "Ya existe un cliente con ese rut_empresa",
        querySchema: z.object({
          razon_social: z.string().optional().meta({ description: "Filtro contains, case-insensitive" }),
          rut_empresa: z.string().optional().meta({ description: "Filtro contains, case-insensitive" }),
        }),
      }),
      "/api/productos/{id}/imagen": {
        post: {
          tags: ["Productos"],
          summary: "Subir imagen de producto",
          description:
            "multipart/form-data, campo 'imagen' (jpg/png/webp, máx. 5MB). Reemplaza la imagen anterior si existía; solo se persiste el path en imagen_del_producto.",
          security: bearerSecurity,
          requestParams: idParam,
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    imagen: {
                      type: "string",
                      format: "binary",
                      description: "Archivo jpg, png o webp, máximo 5MB",
                    },
                  },
                  required: ["imagen"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Imagen guardada, producto actualizado",
              content: { "application/json": { schema: productoResponseSchema } },
            },
            "400": errorResponse(
              "Falta el archivo 'imagen', el id no es válido, el tipo no es jpg/png/webp, o supera 5MB",
            ),
            "401": unauthorized,
            "404": errorResponse("No existe un producto con ese id"),
          },
        },
      },
    },
  });
}
