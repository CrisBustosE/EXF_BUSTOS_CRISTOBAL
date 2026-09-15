import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export class UnauthorizedError extends Error {}
export class InvalidCredentialsError extends Error {}

export const loginSchema = z.object({
  email: z.string().trim().min(1, "El email es requerido"),
  password: z.string().min(1, "El password es requerido"),
});

// Hash dummy fijo (no corresponde a ninguna password real) usado cuando el
// email no existe, para que argon2.verify tarde lo mismo que con un usuario
// real: si solo verificáramos cuando el usuario existe, un atacante podría
// distinguir "email no existe" de "password incorrecta" por tiempo de
// respuesta, filtrando qué emails están registrados (enumeration attack)
// aunque el mensaje y el status code sean idénticos.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$+/FJ23Vp/LZLgg4mCqodYg$Xyll+CuG0NYgPUwadQnsNA4n9kPCBTTs0cmB9tUkuVE";

function jwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET no está configurado");
  return new TextEncoder().encode(value);
}

export type AuthPayload = { id: number; email: string };

export async function login(email: string, password: string): Promise<string> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const valid = await argon2.verify(usuario?.password ?? DUMMY_HASH, password);

  if (!usuario || !valid) {
    throw new InvalidCredentialsError("Email o password incorrectos");
  }

  return new SignJWT({ id: usuario.id, email: usuario.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(jwtSecret());
}

export async function requireAuth(request: NextRequest): Promise<AuthPayload> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw new UnauthorizedError("Falta el header Authorization: Bearer <token>");

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return { id: payload.id as number, email: payload.email as string };
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }
}
