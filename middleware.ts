import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_ROUTES,
  createAccessToken,
  getAccessCookieName,
  getAccessKeyFromPath,
  getAccessPassword,
} from "@/lib/access-control";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const key = getAccessKeyFromPath(pathname);

  if (!key) return NextResponse.next();

  const password = getAccessPassword(key);

  if (!password) {
    const loginUrl = new URL("/akses", request.url);
    loginUrl.searchParams.set("next", ACCESS_ROUTES[key].path);
    loginUrl.searchParams.set("error", "setup");
    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get(getAccessCookieName(key))?.value;
  const expectedToken = await createAccessToken(password, key);

  if (token === expectedToken) return NextResponse.next();

  const loginUrl = new URL("/akses", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/hpp/:path*",
    "/banquet/:path*",
    "/barang-terpakai/:path*",
    "/gudang/:path*",
    "/laporan-kasir/:path*",
    "/invoice/:path*",
    "/tugas-karyawan/:path*",
  ],
};
