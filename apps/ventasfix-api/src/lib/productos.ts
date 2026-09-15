import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { Prisma, type Producto } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class NotFoundError extends Error {}

export class ConflictError extends Error {
  constructor(public readonly fields: string[]) {
    super(`Ya existe un producto con ese ${fields.join(" / ")}`);
  }
}

export class InvalidImageError extends Error {}

const requiredString = (label: string, maxLength?: number) => {
  let schema = z.string().trim().min(1, `${label} es requerido`);
  if (maxLength) {
    schema = schema.max(maxLength, `${label} no puede superar ${maxLength} caracteres`);
  }
  return schema;
};

// Techos de negocio, no solo de tipo de dato: precio_neto/precio_de_venta
// son Float en Prisma (rango enorme, no crashean), pero un precio de más
// de 1 billón de CLP por producto no tiene sentido de negocio, y de paso
// se mantiene bajo Number.MAX_SAFE_INTEGER (evita pérdida de precisión de
// punto flotante). stock_* SÍ son Int en SQLite (overflow real ~2.147
// millones, crashea Prisma con 500 crudo); un millón de unidades por
// producto ya es un techo generoso para un catálogo B2B, muy por debajo
// del límite de la columna.
const PRECIO_MAX = 1_000_000_000_000;
const STOCK_MAX = 1_000_000;

const positiveNumber = (label: string) =>
  z
    .number({ error: `${label} es requerido` })
    .positive(`${label} debe ser > 0`)
    .max(PRECIO_MAX, `${label} no puede superar ${PRECIO_MAX.toLocaleString("es-CL")}`);
const nonNegativeInt = (label: string) =>
  z
    .number({ error: `${label} es requerido` })
    .int(`${label} debe ser un entero`)
    .nonnegative(`${label} debe ser >= 0`)
    .max(STOCK_MAX, `${label} no puede superar ${STOCK_MAX.toLocaleString("es-CL")}`);

export const productoInputSchema = z.object({
  sku: requiredString("El sku", 50),
  nombre: requiredString("El nombre", 150),
  descripcion_corta: requiredString("La descripción corta", 200),
  descripcion_larga: z
    .string()
    .trim()
    .min(1)
    .max(2000, "La descripción larga no puede superar 2000 caracteres")
    .nullish(),
  precio_neto: positiveNumber("El precio neto"),
  precio_de_venta: positiveNumber("El precio de venta"),
  stock_actual: nonNegativeInt("El stock actual"),
  stock_minimo: nonNegativeInt("El stock mínimo"),
  stock_bajo: nonNegativeInt("El stock bajo"),
  stock_alto: nonNegativeInt("El stock alto"),
});

export type ProductoInput = z.infer<typeof productoInputSchema>;

export type EstadoStock = "bajo" | "normal" | "alto";

export type ProductoDTO = Producto & { estado_stock: EstadoStock };

function estadoStock(producto: Producto): EstadoStock {
  if (producto.stock_actual <= producto.stock_bajo) return "bajo";
  if (producto.stock_actual >= producto.stock_alto) return "alto";
  return "normal";
}

function toDTO(producto: Producto): ProductoDTO {
  return { ...producto, estado_stock: estadoStock(producto) };
}

function conflictFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target as string[];
  if (typeof target === "string") return [target];
  return ["sku"];
}

export type ProductoFiltro = { nombre?: string; sku?: string };

export async function listProductos(filtro: ProductoFiltro = {}): Promise<ProductoDTO[]> {
  const where: Prisma.ProductoWhereInput = {};
  if (filtro.nombre) where.nombre = { contains: filtro.nombre };
  if (filtro.sku) where.sku = { contains: filtro.sku };

  const productos = await prisma.producto.findMany({ where, orderBy: { id: "asc" } });
  return productos.map(toDTO);
}

export async function getProducto(id: number): Promise<ProductoDTO> {
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) throw new NotFoundError(`Producto ${id} no existe`);
  return toDTO(producto);
}

export async function createProducto(input: ProductoInput): Promise<ProductoDTO> {
  try {
    const producto = await prisma.producto.create({ data: input });
    return toDTO(producto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError(conflictFields(error));
    }
    throw error;
  }
}

export async function updateProducto(id: number, input: ProductoInput): Promise<ProductoDTO> {
  try {
    const producto = await prisma.producto.update({ where: { id }, data: input });
    return toDTO(producto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new ConflictError(conflictFields(error));
      if (error.code === "P2025") throw new NotFoundError(`Producto ${id} no existe`);
    }
    throw error;
  }
}

export async function deleteProducto(id: number): Promise<void> {
  try {
    await prisma.producto.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Producto ${id} no existe`);
    }
    throw error;
  }
}

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const IMAGEN_EXT_PERMITIDA: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const PRODUCTOS_DIR = path.join(process.cwd(), "public", "productos");

/**
 * Guarda `file` en public/productos/, actualiza SOLO imagen_del_producto
 * (nunca el binario) y borra el archivo físico anterior si existía.
 */
export async function setProductoImagen(id: number, file: File): Promise<ProductoDTO> {
  const actual = await prisma.producto.findUnique({ where: { id } });
  if (!actual) throw new NotFoundError(`Producto ${id} no existe`);

  const extension = IMAGEN_EXT_PERMITIDA[file.type];
  if (!extension) {
    throw new InvalidImageError(
      `Tipo de archivo no soportado (${file.type || "desconocido"}); se aceptan jpg, png o webp`,
    );
  }
  if (file.size > MAX_IMAGEN_BYTES) {
    throw new InvalidImageError("La imagen supera el límite de 5MB");
  }

  const filename = `${id}-${Date.now()}-${randomUUID()}.${extension}`;
  await mkdir(PRODUCTOS_DIR, { recursive: true });
  await writeFile(path.join(PRODUCTOS_DIR, filename), Buffer.from(await file.arrayBuffer()));

  const imagenUrl = `/productos/${filename}`;
  const producto = await prisma.producto.update({ where: { id }, data: { imagen_del_producto: imagenUrl } });

  if (actual.imagen_del_producto) {
    void unlink(path.join(PRODUCTOS_DIR, path.basename(actual.imagen_del_producto))).catch(() => {});
  }

  return toDTO(producto);
}
