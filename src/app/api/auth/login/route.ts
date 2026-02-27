import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Normalize input
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    console.log("NORMALIZED EMAIL:", email);

    if (!email || !password) {
      return NextResponse.json({ success: false, reason: "missing credentials" });
    }

    const db = await getDb();

    // Case-insensitive + trimmed match
    const user = await db.collection("users").findOne({
      email: { $regex: `^${email}$`, $options: "i" }
    });

    console.log("USER FOUND:", user);

    if (!user) {
      return NextResponse.json({ success: false, reason: "user not found" });
    }

    if (user.password?.trim() !== password) {
      console.log("PASSWORD MISMATCH");
      return NextResponse.json({ success: false, reason: "password mismatch" });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "session",
      value: user._id.toString(),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return response;

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ success: false });
  }
}