import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const { batchId } = body;

    if (!batchId || !ObjectId.isValid(batchId)) {
      return NextResponse.json(
        { error: "Valid Batch ID required" },
        { status: 400 }
      );
    }

    // 1️⃣ Find batch safely
    const batch = await db.collection("production_batches").findOne({
      _id: new ObjectId(batchId),
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    if (batch.status === "completed") {
      return NextResponse.json(
        { error: "Batch already completed" },
        { status: 400 }
      );
    }

    // 2️⃣ Add finished products to inventory (safe ObjectId handling)
    if (batch.finishedProducts && batch.finishedProducts.length > 0) {
      for (const item of batch.finishedProducts) {

        if (!item.productId || !ObjectId.isValid(item.productId)) {
          console.error("Invalid productId:", item.productId);
          continue; // skip invalid entries instead of crashing
        }

        const productObjectId = new ObjectId(item.productId);

        const product = await db.collection("inventory").findOne({
          _id: productObjectId,
          type: "finished",
        });

        if (!product) {
          console.error("Finished product not found:", item.productId);
          continue;
        }

        await db.collection("inventory").updateOne(
          { _id: productObjectId },
          { $inc: { stock: Number(item.quantity) || 0 } }
        );
      }
    }

    // 3️⃣ Update batch status
    await db.collection("production_batches").updateOne(
      { _id: new ObjectId(batchId) },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Production complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}