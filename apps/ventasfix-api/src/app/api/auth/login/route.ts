import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { InvalidCredentialsError, login } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().min(1, "El email es requerido"),
  password: z.string().min(1, "El password es requerido"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const token = await login(parsed.data.email, parsed.data.password);
    return NextResponse.json({ token });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
