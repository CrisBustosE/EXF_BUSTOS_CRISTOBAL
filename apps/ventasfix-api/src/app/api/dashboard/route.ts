import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const [total_usuarios, total_productos, total_clientes] = await Promise.all([
      prisma.usuario.count(),
      prisma.producto.count(),
      prisma.cliente.count(),
    ]);

    return NextResponse.json({ total_usuarios, total_productos, total_clientes });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
