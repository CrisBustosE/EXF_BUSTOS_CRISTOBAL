import { NextRequest, NextResponse } from "next/server";
import { forwardMultipartToApi } from "@/lib/api-proxy";
import { getSession } from "@/lib/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  return forwardMultipartToApi(`/api/productos/${id}/imagen`, session, formData);
}
