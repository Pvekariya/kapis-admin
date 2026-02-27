import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const db = await getDb();

  const user = await db.collection("users").findOne({
    email,
    password,
  });

  if (!user) {
    return NextResponse.json({ success: false });
  }

  const res = NextResponse.json({ success: true });

  res.cookies.set({
    name: "session",
    value: user._id.toString(),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  console.log("SESSION COOKIE SET:", user._id.toString());

  return res;
}