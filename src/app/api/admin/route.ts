import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "contacted", "closed"]),
});

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).optional(),
  product: z.string().max(200).optional(),
});

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const leads = await db
    .collection("leads")
    .find({})
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(leads);
}

export async function PATCH(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, status } = parsed.data;
  const db = await getDb();

  await db
    .collection("leads")
    .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db = await getDb();

  await db.collection("leads").insertOne({
    ...parsed.data,
    status: "new",
    date: new Date(),
    createdAt: new Date(),
  });

  await db.collection("notifications").insertOne({
    message: `New lead: ${parsed.data.name}`,
    type: "lead",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}