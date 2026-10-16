import { NextRequest, NextResponse } from "next/server";

async function expectedToken(secret: string) {
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

export async function middleware(request: NextRequest) {
  const secret = process.env.TEAM_SOFTWARE_PASSWORD;
  if (!secret) {
    return new NextResponse("Team Software password is not configured.", { status: 503 });
  }

  const token = request.cookies.get("team_access")?.value;
  if (token && token === (await expectedToken(secret))) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/akses", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!akses|api/akses|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
