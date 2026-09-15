import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { ConflictError, createUsuario, listUsuarios, usuarioInputSchema } from "@/lib/usuarios";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const usuarios = await listUsuarios();
    return NextResponse.json(usuarios);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const body = await request.json().catch(() => null);
    const parsed = usuarioInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const usuario = await createUsuario(parsed.data);
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
