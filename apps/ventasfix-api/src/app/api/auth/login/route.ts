import { NextRequest, NextResponse } from "next/server";
import { InvalidCredentialsError, login, loginSchema } from "@/lib/auth";

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
