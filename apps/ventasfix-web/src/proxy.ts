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
      const response = NextResponse.next();
      // Evita que el navegador restaure esta página protegida desde el
      // bfcache al navegar atrás/adelante (ej. tras auto-eliminar la
      // propia cuenta — ver 3.3.5/4): sin esto, el back-forward cache
      // puede mostrar una copia congelada de la página como si la
      // sesión siguiera activa. No es una falla de seguridad (cualquier
      // acción real sigue devolviendo 401 desde el servidor), pero
      // confunde al usuario. `no-store` es la directiva que los
      // navegadores usan para decidir elegibilidad de bfcache.
      response.headers.set("Cache-Control", "no-store");
      return response;
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
