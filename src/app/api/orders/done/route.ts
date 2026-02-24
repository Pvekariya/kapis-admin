export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing order id" });
    }

    let objectId: ObjectId;

    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid order id" });
    }

    const order = await db.collection("orders").findOne({ _id: objectId });
    console.log("ORDER:", order);

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" });
    }

    const productObjectId =
      typeof order.productId === "string"
        ? new ObjectId(order.productId)
        : order.productId;

    const qty = parseInt(order.qty);
    if (isNaN(qty)) {
      return NextResponse.json({ success: false, error: "Invalid qty" });
    }

    // ✅ restore stock ONLY for low-stock orders
    if (order.source === "low") {
      const result1 = await db.collection("inventory").updateOne(
        { _id: productObjectId },
        { $inc: { stock: qty } }
      );

      console.log("inventory result:", result1);

      if (result1.matchedCount === 0) {
        return NextResponse.json({ success: false, error: "Inventory not found" });
      }
    }

    const result2 = await db.collection("orders").deleteOne({ _id: objectId });
    console.log("delete result:", result2);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("DONE API ERROR:", err);
    return NextResponse.json({ success: false, error: "Server error" });
  }
}