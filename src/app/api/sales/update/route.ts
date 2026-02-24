import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { id, update } = await req.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Missing ID",
      });
    }

    const db = await getDb();

    const salesCol = db.collection("sales");
    const inventoryCol = db.collection("inventory");

    // fetch old invoice to reverse previous stock
    const oldDoc = await salesCol.findOne({ _id: new ObjectId(id) });

    if (!oldDoc) {
      return NextResponse.json({
        success: false,
        error: "Invoice not found",
      });
    }

    const items = update.items || [];

    const subtotal = items.reduce((sum: number, item: any) => {
      const itemTotal =
        Number(item.qty || 0) * Number(item.price || 0);
      item.total = itemTotal;
      return sum + itemTotal;
    }, 0);

    const gst = Math.round(subtotal * 0.12); // 12% GST (adjust if needed)
    const grandTotal = subtotal + gst;

    /* ---- INVENTORY ADJUSTMENT ---- */

    // map old quantities
    const oldMap: Record<string, number> = {};
    (oldDoc.items || []).forEach((item: any) => {
      oldMap[item.productId] =
        (oldMap[item.productId] || 0) + Number(item.qty || 0);
    });

    // map new quantities
    const newMap: Record<string, number> = {};
    items.forEach((item: any) => {
      newMap[item.productId] =
        (newMap[item.productId] || 0) + Number(item.qty || 0);
    });

    // compute delta and apply
    const productIds = new Set([
      ...Object.keys(oldMap),
      ...Object.keys(newMap),
    ]);

    for (const pid of productIds) {
      const oldQty = oldMap[pid] || 0;
      const newQty = newMap[pid] || 0;
      const diff = newQty - oldQty;

      if (diff !== 0) {
        // if diff positive → reduce inventory
        // if diff negative → restore inventory
        await inventoryCol.updateOne(
          { _id: new ObjectId(pid) },
          { $inc: { stock: -diff } }
        );
      }
    }

    await salesCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          date: new Date(update.date),
          items,
          customer: update.customer,
          address: update.address,
          subtotal,
          gst,
          total: grandTotal,
        },
      }
    );

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);

    return NextResponse.json({
      success: false,
      error: "Server error",
    });
  }
}