import { NextRequest, NextResponse } from "next/server";
import { ConflictError, clienteInputSchema, createCliente, listClientes } from "@/lib/clientes";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const razon_social = searchParams.get("razon_social") ?? undefined;
  const rut_empresa = searchParams.get("rut_empresa") ?? undefined;

  const clientes = await listClientes({ razon_social, rut_empresa });
  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = clienteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const cliente = await createCliente(parsed.data);
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
