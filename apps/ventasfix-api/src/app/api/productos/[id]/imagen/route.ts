import { NextRequest, NextResponse } from "next/server";
import { InvalidImageError, NotFoundError, setProductoImagen } from "@/lib/productos";
import { parseId } from "@/lib/http";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const formData = await request.formData().catch(() => null);
  const imagen = formData?.get("imagen");
  if (!(imagen instanceof File) || imagen.size === 0) {
    return NextResponse.json(
      { error: "Se requiere el archivo 'imagen' en el form-data" },
      { status: 400 },
    );
  }

  try {
    const producto = await setProductoImagen(id, imagen);
    return NextResponse.json(producto);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
