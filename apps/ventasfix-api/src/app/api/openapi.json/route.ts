import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/openapi";

// Público a propósito: es documentación, no datos de negocio.
export async function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
