// Nombre de la cookie httpOnly que guarda el JWT de sesión. Compartido
// entre el BFF de login (la setea), proxy.ts (la lee) y el logout (la borra).
export const COOKIE_NAME = "token";

// Mismo JWT_SECRET que ventasfix-api. Compartido entre proxy.ts (verifica
// en cada request) y src/lib/session.ts (lee el email/token de la sesión).
export function jwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET no está configurado");
  return new TextEncoder().encode(value);
}
