import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const db = await getDb();

    // 🔹 Find user EXACTLY as stored
    const user = await db.collection("users").findOne({
      email: email,
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" });
    }

    if (user.password !== password) {
      return NextResponse.json({ success: false, error: "Wrong password" });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "session",
      value: user._id.toString(),
      httpOnly: true,
      secure: true,        // ALWAYS true on Vercel
      sameSite: "lax",
      path: "/",
    });

    return response;

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ success: false, error: "Server error" });
  }
}