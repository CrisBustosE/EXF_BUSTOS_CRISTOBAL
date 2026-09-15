import { z } from "zod";
import { Prisma, type Cliente } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidRut, normalizeRut } from "@/lib/rut";

export class NotFoundError extends Error {}

export class ConflictError extends Error {
  constructor(public readonly fields: string[]) {
    super(`Ya existe un cliente con ese ${fields.join(" / ")}`);
  }
}

const requiredString = (label: string) => z.string().trim().min(1, `${label} es requerido`);

const rutEmpresaField = requiredString("El rut_empresa")
  .refine(isValidRut, "RUT inválido (dígito verificador no coincide)")
  .transform((value) => normalizeRut(value) as string);

export const clienteInputSchema = z.object({
  rut_empresa: rutEmpresaField,
  rubro: requiredString("El rubro"),
  razon_social: requiredString("La razón social"),
  telefono: requiredString("El teléfono"),
  direccion: requiredString("La dirección"),
  nombre_contacto: requiredString("El nombre de contacto"),
  email_contacto: requiredString("El email de contacto").email("Email inválido"),
});

export type ClienteInput = z.infer<typeof clienteInputSchema>;

function conflictFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target as string[];
  if (typeof target === "string") return [target];
  return ["rut_empresa"];
}

export type ClienteFiltro = { razon_social?: string; rut_empresa?: string };

export async function listClientes(filtro: ClienteFiltro = {}): Promise<Cliente[]> {
  const where: Prisma.ClienteWhereInput = {};
  if (filtro.razon_social) where.razon_social = { contains: filtro.razon_social };
  if (filtro.rut_empresa) where.rut_empresa = { contains: filtro.rut_empresa };

  return prisma.cliente.findMany({ where, orderBy: { id: "asc" } });
}

export async function getCliente(id: number): Promise<Cliente> {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new NotFoundError(`Cliente ${id} no existe`);
  return cliente;
}

export async function createCliente(input: ClienteInput): Promise<Cliente> {
  try {
    return await prisma.cliente.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError(conflictFields(error));
    }
    throw error;
  }
}

export async function updateCliente(id: number, input: ClienteInput): Promise<Cliente> {
  try {
    return await prisma.cliente.update({ where: { id }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new ConflictError(conflictFields(error));
      if (error.code === "P2025") throw new NotFoundError(`Cliente ${id} no existe`);
    }
    throw error;
  }
}

export async function deleteCliente(id: number): Promise<void> {
  try {
    await prisma.cliente.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Cliente ${id} no existe`);
    }
    throw error;
  }
}
