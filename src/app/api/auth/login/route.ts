import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Missing credentials" });
    }

    const db = await getDb();

    // Find user by email only
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      console.log("User not found:", email);
      return NextResponse.json({ success: false, message: "User not found" });
    }

    // Compare password (plain text version - since your DB stores plain text)
    if (user.password !== password) {
      console.log("Password mismatch for:", email);
      return NextResponse.json({ success: false, message: "Wrong password" });
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

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}