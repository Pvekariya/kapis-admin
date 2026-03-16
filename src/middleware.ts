import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Public API routes that don't require a session
const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/login";
  const isAdminPage = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicApi = PUBLIC_API_ROUTES.some((p) => pathname === p);

  const token = req.cookies.get("session")?.value;

  // ── API routes ────────────────────────────────────────────────────────────
  if (isApiRoute && !isPublicApi) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
  }

  // ── Admin pages ───────────────────────────────────────────────────────────
  if (isAdminPage) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.set("session", "", { expires: new Date(0) });
      return res;
    }
  }

  // ── Login page ────────────────────────────────────────────────────────────
  if (isLogin && token) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      return NextResponse.redirect(new URL("/admin", req.url));
    } catch {
      // Token invalid — let them see login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/api/:path*",
  ],
};