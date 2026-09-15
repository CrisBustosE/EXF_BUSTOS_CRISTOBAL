import { z } from "zod";
import { Prisma, type Producto } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class NotFoundError extends Error {}

export class ConflictError extends Error {
  constructor(public readonly fields: string[]) {
    super(`Ya existe un producto con ese ${fields.join(" / ")}`);
  }
}

const requiredString = (label: string) => z.string().trim().min(1, `${label} es requerido`);
const positiveNumber = (label: string) => z.number({ error: `${label} es requerido` }).positive(`${label} debe ser > 0`);
const nonNegativeInt = (label: string) =>
  z.number({ error: `${label} es requerido` }).int(`${label} debe ser un entero`).nonnegative(`${label} debe ser >= 0`);

export const productoInputSchema = z.object({
  sku: requiredString("El sku"),
  nombre: requiredString("El nombre"),
  descripcion_corta: requiredString("La descripción corta"),
  descripcion_larga: z.string().trim().min(1).nullish(),
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
