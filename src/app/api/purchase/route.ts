import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const {
    invoice,
    supplier,
    items,
    total,
  } = body;

  const purchaseItems: any[] = [];

  for (const i of items) {
    if (!i.productId || !i.qty) continue;

    const product = await db.collection("inventory").findOne({
      _id: new ObjectId(i.productId),
    });

    if (!product) continue;

    // ✅ add stock
    await db.collection("inventory").updateOne(
      { _id: product._id },
      { $inc: { stock: Number(i.qty) } }
    );

    purchaseItems.push({
      productId: product._id,
      name: product.name,
      qty: Number(i.qty),
      price: Number(i.price),
      total: Number(i.qty) * Number(i.price),
    });
  }

  // ✅ save purchase bill
  await db.collection("purchases").insertOne({
    invoice,
    supplier,
    items: purchaseItems,
    total,
    date: new Date(),
  });

  // ✅ deduct revenue
  await db.collection("analytics").updateOne(
    { key: "revenue" },
    { $inc: { value: -Number(total) } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}