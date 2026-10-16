import { NextRequest, NextResponse } from "next/server";

async function accessToken(secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("satu-restoe-team-software-access-v1"),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

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
  response.cookies.set("team_access", await accessToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
