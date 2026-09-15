import { NextResponse } from "next/server";
import type { Session } from "@/lib/session";

/**
 * Reenvía una request a ventasfix-api adjuntando el JWT de la sesión
 * (server-to-server, sin CORS — STACK.md sección 3). Usado por los BFF
 * route handlers de cada entidad (usuarios, y luego productos/clientes).
 */
export async function forwardToApi(
  path: string,
  session: Session,
  init?: { method?: string; body?: string },
): Promise<NextResponse> {
  const apiRes = await fetch(`${process.env.API_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body,
  });

  if (apiRes.status === 204) return new NextResponse(null, { status: 204 });

  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
