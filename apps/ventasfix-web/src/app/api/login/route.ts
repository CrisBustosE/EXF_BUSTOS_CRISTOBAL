import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth-cookie";

// BFF: el navegador nunca llama a ventasfix-api directamente ni ve el JWT.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  let apiRes: Response;
  try {
    apiRes = await fetch(`${process.env.API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo contactar el servidor" }, { status: 502 });
  }

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok || typeof data.token !== "string") {
    return NextResponse.json(data, { status: apiRes.status || 502 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
