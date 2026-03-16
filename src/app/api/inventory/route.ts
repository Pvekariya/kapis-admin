import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const ItemSchema = z.object({
  name: z.string().min(1).max(200),
  stock: z.number().min(0),
  price: z.number().min(0),
  hsn: z.string().max(50).optional().default(""),
  color: z.string().max(100).optional().default(""),
  type: z.enum(["raw", "finished"]),
  packing: z.string().max(100).optional().default(""),
  costPrice: z.number().min(0).optional(),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  stock: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  hsn: z.string().max(50).optional(),
  color: z.string().max(100).optional(),
  packing: z.string().max(100).optional(),
  costPrice: z.number().min(0).optional(),
});

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const items = await db.collection("inventory").find().toArray();

  const normalized = items.map((item: any) => ({
    ...item,
    quantity: item.stock ?? item.quantity ?? 0,
    costPrice: item.costPrice ?? item.price ?? 0,
  }));

  return NextResponse.json(normalized);
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = ItemSchema.safeParse({
    ...body,
    stock: Number(body.stock ?? body.quantity ?? 0),
    price: Number(body.price ?? 0),
    costPrice: Number(body.costPrice ?? body.price ?? 0),
  });

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db = await getDb();

  // Merge if same name+color+type+packing already exists
  const existing = await db.collection("inventory").findOne({
    name: parsed.data.name,
    color: parsed.data.color,
    type: parsed.data.type,
    packing: parsed.data.packing,
  });

  if (existing) {
    await db
      .collection("inventory")
      .updateOne(
        { _id: existing._id },
        { $inc: { stock: parsed.data.stock } }
      );
  } else {
    await db.collection("inventory").insertOne({
      ...parsed.data,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PatchSchema.safeParse({
    ...body,
    stock: body.stock !== undefined ? Number(body.stock) : undefined,
    price: body.price !== undefined ? Number(body.price) : undefined,
    costPrice: body.costPrice !== undefined ? Number(body.costPrice) : undefined,
  });

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, ...fields } = parsed.data;

  // Only set fields that were actually provided
  const updateFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) updateFields[k] = v;
  }

  const db = await getDb();
  await db
    .collection("inventory")
    .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  if (!body.id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  await db
    .collection("inventory")
    .deleteOne({ _id: new ObjectId(body.id) });

  return NextResponse.json({ success: true });
}