import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { setSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const db = await getDb();
    const user = await db.collection("users").findOne({
      email: normalizedEmail,
    });

    if (!user) {
      // Same response as wrong password — don't reveal which field failed
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Support both bcrypt hashed and legacy plaintext passwords
    let passwordMatch = false;

    if (user.password?.startsWith("$2")) {
      // Already hashed with bcrypt
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plaintext — compare then upgrade to bcrypt
      passwordMatch = user.password?.trim() === password;
      if (passwordMatch) {
        const hashed = await bcrypt.hash(password, 12);
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { password: hashed } }
        );
      }
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    setSessionCookie(response, {
      userId: user._id.toString(),
      email: user.email,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}