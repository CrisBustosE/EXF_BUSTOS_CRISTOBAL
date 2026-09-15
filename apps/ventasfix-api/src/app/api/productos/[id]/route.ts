import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { parseId } from "@/lib/http";
import {
  ConflictError,
  NotFoundError,
  deleteProducto,
  getProducto,
  productoInputSchema,
  updateProducto,
} from "@/lib/productos";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(request);

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

    const producto = await getProducto(id);
    return NextResponse.json(producto);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(request);

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const parsed = productoInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const producto = await updateProducto(id, parsed.data);
    return NextResponse.json(producto);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(request);

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

    await deleteProducto(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
