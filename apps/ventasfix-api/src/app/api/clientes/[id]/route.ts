import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError, requireAuth } from "@/lib/auth";
import {
  ConflictError,
  NotFoundError,
  clienteInputSchema,
  deleteCliente,
  getCliente,
  updateCliente,
} from "@/lib/clientes";
import { parseId } from "@/lib/http";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(request);

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: "id inválido" }, { status: 400 });

    const cliente = await getCliente(id);
    return NextResponse.json(cliente);
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
    const parsed = clienteInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const cliente = await updateCliente(id, parsed.data);
    return NextResponse.json(cliente);
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

    await deleteCliente(id);
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
