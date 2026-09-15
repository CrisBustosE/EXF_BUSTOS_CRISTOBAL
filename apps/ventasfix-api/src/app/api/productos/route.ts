import { NextRequest, NextResponse } from "next/server";
import { ConflictError, createProducto, listProductos, productoInputSchema } from "@/lib/productos";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre") ?? undefined;
  const sku = searchParams.get("sku") ?? undefined;

  const productos = await listProductos({ nombre, sku });
  return NextResponse.json(productos);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = productoInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const producto = await createProducto(parsed.data);
    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
