import argon2 from "argon2";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidRut, normalizeRut } from "@/lib/rut";

export class NotFoundError extends Error {}

export class ConflictError extends Error {
  constructor(public readonly fields: string[]) {
    super(`Ya existe un usuario con ese ${fields.join(" / ")}`);
  }
}

const requiredString = (label: string) => z.string().trim().min(1, `${label} es requerido`);

const rutField = requiredString("El rut")
  .refine(isValidRut, "RUT inválido (dígito verificador no coincide)")
  .transform((value) => normalizeRut(value) as string);

const emailField = requiredString("El email")
  .email("Email inválido")
  .refine((value) => value.toLowerCase().endsWith("@ventasfix.cl"), {
    message: "El email debe terminar en @ventasfix.cl",
  });

export const usuarioInputSchema = z.object({
  rut: rutField,
  nombre: requiredString("El nombre"),
  apellido: requiredString("El apellido"),
  email: emailField,
  password: requiredString("El password"),
});

export type UsuarioInput = z.infer<typeof usuarioInputSchema>;

// En update, password es opcional: vacío/ausente significa "no cambiar
// la contraseña" (ver updateUsuario). Cuando sí viene, misma regla que
// en create (no vacío tras trim).
export const usuarioUpdateSchema = usuarioInputSchema.extend({
  password: z.string().trim().optional(),
});

export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;

export type UsuarioDTO = {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
};

function toDTO(usuario: UsuarioDTO & { password: string }): UsuarioDTO {
  const { id, rut, nombre, apellido, email } = usuario;
  return { id, rut, nombre, apellido, email };
}

function conflictFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target as string[];
  if (typeof target === "string") return [target];
  return ["rut/email"];
}

export async function listUsuarios(): Promise<UsuarioDTO[]> {
  const usuarios = await prisma.usuario.findMany({ orderBy: { id: "asc" } });
  return usuarios.map(toDTO);
}

export async function getUsuario(id: number): Promise<UsuarioDTO> {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new NotFoundError(`Usuario ${id} no existe`);
  return toDTO(usuario);
}

export async function createUsuario(input: UsuarioInput): Promise<UsuarioDTO> {
  const password = await argon2.hash(input.password);
  try {
    const usuario = await prisma.usuario.create({ data: { ...input, password } });
    return toDTO(usuario);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError(conflictFields(error));
    }
    throw error;
  }
}

export async function updateUsuario(id: number, input: UsuarioUpdateInput): Promise<UsuarioDTO> {
  const { password: newPassword, ...rest } = input;
  const data: Prisma.UsuarioUpdateInput = { ...rest };
  if (newPassword) {
    data.password = await argon2.hash(newPassword);
  }

  try {
    const usuario = await prisma.usuario.update({ where: { id }, data });
    return toDTO(usuario);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new ConflictError(conflictFields(error));
      if (error.code === "P2025") throw new NotFoundError(`Usuario ${id} no existe`);
    }
    throw error;
  }
}

export async function deleteUsuario(id: number): Promise<void> {
  try {
    await prisma.usuario.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Usuario ${id} no existe`);
    }
    throw error;
  }
}
