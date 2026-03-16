import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { z } from "zod";

const PostSchema = z.object({
  message: z.string().min(1).max(500),
  type: z.string().max(50).optional().default("info"),
});

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const list = await db
    .collection("notifications")
    .find()
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db = await getDb();
  await db.collection("notifications").insertOne({
    ...parsed.data,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  await db.collection("notifications").deleteMany({});
  return NextResponse.json({ success: true });
}