import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const payload = await requireAuth();

    const db = await getDb();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user) return NextResponse.json(null);

    // Never return password
    return NextResponse.json({
      email: user.email,
      name: user.name || "",
      avatar: user.avatar || "",
    });
  } catch {
    return NextResponse.json(null);
  }
}