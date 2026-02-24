import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const product = await db.collection("inventory").findOne({
    _id: new ObjectId(body.productId),
  });

  if (!product) return NextResponse.json({ ok: false });

  await db.collection("orders").insertOne({
    buyer: "Inventory",
    source: "low",
    productId: product._id,
    name: product.name,
    qty: body.qty,
    status: "pending",
    priority: "normal",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}