import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const secret = process.env.TEAM_SOFTWARE_PASSWORD;
  if (!secret) {
    return new NextResponse("Team Software password is not configured.", { status: 503 });
  }

  const token = request.cookies.get("team_access")?.value;
  if (token && token === secret) {
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
