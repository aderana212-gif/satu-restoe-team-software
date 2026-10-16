import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.TEAM_SOFTWARE_PASSWORD;
  if (!secret) {
    return NextResponse.json({ error: "Password aplikasi belum dikonfigurasi." }, { status: 503 });
  }

  let body: { password?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password !== secret) {
    return NextResponse.json({ error: "Password salah. Coba lagi." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    next: typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/",
  });
  response.cookies.set("team_access", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
