import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET — fetch inventory
export async function GET() {
  const db = await getDb();
  const items = await db.collection("inventory").find().toArray();

  // 🔥 Normalize field names for frontend
  const normalized = items.map((item: any) => ({
    ...item,
    quantity: item.stock ?? item.quantity ?? 0,
    costPrice: item.costPrice ?? item.price ?? 0,
  }));

  return NextResponse.json(normalized);
}

// POST — add or merge product
export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const existing = await db.collection("inventory").findOne({
    name: body.name,
    color: body.color,
    type: body.type,
    packing: body.packing,
  });

  if (existing) {
    await db.collection("inventory").updateOne(
      { _id: existing._id },
      { $inc: { stock: Number(body.quantity || body.stock || 0) } }
    );
  } else {
    await db.collection("inventory").insertOne({
      ...body,
      stock: Number(body.quantity || body.stock || 0),
      price: Number(body.price || 0),
      costPrice: Number(body.costPrice || body.price || 0),
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
}

// PATCH — update item
export async function PATCH(req: Request) {
  const db = await getDb();
  const body = await req.json();

  await db.collection("inventory").updateOne(
    { _id: new ObjectId(body.id) },
    { $set: body }
  );

  return NextResponse.json({ success: true });
}

// DELETE — remove item
export async function DELETE(req: Request) {
  const db = await getDb();
  const body = await req.json();

  await db.collection("inventory").deleteOne({
    _id: new ObjectId(body.id),
  });

  return NextResponse.json({ success: true });
}