import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, jwtSecret } from "@/lib/auth-cookie";

// Reemplaza a middleware.ts (Next.js 16). Corre en runtime Node.js, no
// Edge; jose funciona igual en ambos, así que no cambia nada del lado de
// la verificación del JWT (ver docs/STACK.md sección 4).
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      await jwtVerify(token, jwtSecret());
      return NextResponse.next();
    } catch {
      // token inválido o expirado: cae al redirect de abajo
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Todo /api/* es un BFF: maneja su propia sesión vía getSession() y
  // responde 401 JSON, nunca debe redirigir a la página HTML de /login
  // (rompería el fetch() del cliente al intentar parsear la respuesta).
  matcher: ["/((?!login|api/|_next/static|_next/image|favicon.ico).*)"],
};
