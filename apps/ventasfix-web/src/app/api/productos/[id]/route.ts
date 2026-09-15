import { NextRequest, NextResponse } from "next/server";
import { forwardToApi } from "@/lib/api-proxy";
import { getSession } from "@/lib/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.text();
  return forwardToApi(`/api/productos/${id}`, session, { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  return forwardToApi(`/api/productos/${id}`, session, { method: "DELETE" });
}
