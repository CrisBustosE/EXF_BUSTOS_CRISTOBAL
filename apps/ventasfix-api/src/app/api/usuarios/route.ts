import { NextRequest, NextResponse } from "next/server";
import { ConflictError, createUsuario, listUsuarios, usuarioInputSchema } from "@/lib/usuarios";

export async function GET() {
  const usuarios = await listUsuarios();
  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = usuarioInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const usuario = await createUsuario(parsed.data);
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
