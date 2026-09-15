import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { COOKIE_NAME, jwtSecret } from "@/lib/auth-cookie";

export type Session = { email: string; token: string };

// Lee la cookie httpOnly y verifica el JWT (mismo JWT_SECRET que
// ventasfix-api). Usado por el layout protegido (mostrar el email) y por
// las vistas que llaman a la API (adjuntar el token como Bearer).
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (typeof payload.email !== "string") return null;
    return { email: payload.email, token };
  } catch {
    return null;
  }
}
