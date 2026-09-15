import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint mínimo para verificar que la API arriba y que Prisma puede
// hablar con la base de datos SQLite (prueba de stack, sin lógica de
// dominio todavía).
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        db: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
