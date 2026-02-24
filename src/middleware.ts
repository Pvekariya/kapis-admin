import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("session");

  const isLogin = req.nextUrl.pathname === "/login";
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");

  // not logged in → block admin
  if (!session && isAdmin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // logged in → don’t allow login page
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};