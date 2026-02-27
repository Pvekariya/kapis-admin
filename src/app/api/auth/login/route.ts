import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("BODY:", body);

    const db = await getDb();

    const user = await db.collection("users").findOne({
      email: body.email,
    });

    console.log("EMAIL RECEIVED:", body.email);
    console.log("USER FOUND:", user);

    if (!user) {
      return NextResponse.json({ success: false, reason: "user not found" });
    }

    if (user.password !== body.password) {
      console.log("PASSWORD RECEIVED:", body.password);
      console.log("PASSWORD IN DB:", user.password);
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