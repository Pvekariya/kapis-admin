import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export interface AuthPayload {
  userId: string;
  email: string;
}

/** Call at the top of every API route that needs auth.
 *  Returns the decoded payload, or throws → catch and return 401. */
export async function requireAuth(): Promise<AuthPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) throw new Error("No session");
  try {
    return jwt.verify(token, SECRET) as AuthPayload;
  } catch {
    throw new Error("Invalid session");
  }
}

/** Shorthand: returns a 401 response if auth fails, null if ok.
 *  Usage:  const unauth = await guardAuth(); if (unauth) return unauth;
 */
export async function guardAuth(): Promise<NextResponse | null> {
  try {
    await requireAuth();
    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Build a signed JWT and attach it as an httpOnly cookie on the response. */
export function setSessionCookie(
  response: NextResponse,
  payload: AuthPayload
): void {
  const token = jwt.sign(payload, SECRET, { expiresIn: "12h" });
  response.cookies.set({
    name: "session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

/** Clear the session cookie (logout). */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}