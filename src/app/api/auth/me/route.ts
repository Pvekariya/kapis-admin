import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);

  if (!match) return NextResponse.json(null);

  const db = await getDb();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(match[1]),
  });

  if (!user) return NextResponse.json(null);

  return NextResponse.json({
    email: user.email,
    avatar: user.avatar || "",
  });
}