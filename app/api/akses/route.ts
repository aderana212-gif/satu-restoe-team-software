import { NextResponse } from "next/server";
import {
  ACCESS_ROUTES,
  type AccessKey,
  createAccessToken,
  getAccessCookieName,
  getAccessPassword,
} from "@/lib/access-control";

export const runtime = "nodejs";

function isAccessKey(value: unknown): value is AccessKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ACCESS_ROUTES, value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const key = body?.key;
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isAccessKey(key)) {
      return NextResponse.json({ ok: false, message: "Akses tidak dikenal." }, { status: 400 });
    }

    const configuredPassword = getAccessPassword(key);

    if (!configuredPassword) {
      return NextResponse.json(
        { ok: false, message: "Password tab belum dikonfigurasi di Vercel." },
        { status: 503 },
      );
    }

    if (password !== configuredPassword) {
      return NextResponse.json({ ok: false, message: "Password salah." }, { status: 401 });
    }

    const token = await createAccessToken(configuredPassword, key);
    const response = NextResponse.json({ ok: true, redirect: ACCESS_ROUTES[key].path });

    response.cookies.set({
      name: getAccessCookieName(key),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: ACCESS_ROUTES[key].path,
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }
}
