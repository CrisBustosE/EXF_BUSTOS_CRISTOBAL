import { NextRequest, NextResponse } from "next/server";
import { forwardToApi } from "@/lib/api-proxy";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.text();
  return forwardToApi("/api/productos", session, { method: "POST", body });
}
