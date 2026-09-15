import { NextRequest, NextResponse } from "next/server";
import { forwardToApi } from "@/lib/api-proxy";
import { getSession } from "@/lib/session";

// BFF: el navegador nunca llama a ventasfix-api directo. Validación de
// negocio (RUT, dominio de email, unicidad) vive en la API; acá solo se
// adjunta el JWT y se reenvía la respuesta tal cual.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.text();
  return forwardToApi("/api/usuarios", session, { method: "POST", body });
}
