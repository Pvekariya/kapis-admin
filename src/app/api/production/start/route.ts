import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const { rawMaterials, finishedProducts, date } = body;

    if (!rawMaterials || rawMaterials.length === 0) {
      return NextResponse.json(
        { error: "Raw materials required" },
        { status: 400 }
      );
    }

    let totalRawCost = 0;
    let totalOutputQty = 0;

    // 1️⃣ Validate stock + calculate raw cost
    for (const item of rawMaterials) {
      if (!ObjectId.isValid(item.productId)) {
        return NextResponse.json(
          { error: "Invalid raw material ID" },
          { status: 400 }
        );
      }

      const product = await db.collection("inventory").findOne({
        _id: new ObjectId(item.productId),
        type: "raw",
      });

      if (!product) {
        return NextResponse.json(
          { error: `Raw material not found` },
          { status: 400 }
        );
      }

      if (product.stock < Number(item.quantity)) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const materialCost =
        (Number(product.purchasePrice) || 0) * Number(item.quantity);

      totalRawCost += materialCost;
    }

    // 2️⃣ Deduct raw materials
    for (const item of rawMaterials) {
      await db.collection("inventory").updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -Number(item.quantity) } }
      );
    }

    // 3️⃣ Calculate total output quantity
    if (finishedProducts && finishedProducts.length > 0) {
      for (const fp of finishedProducts) {
        totalOutputQty += Number(fp.quantity) || 0;
      }
    }

    const costPerUnit =
      totalOutputQty > 0 ? totalRawCost / totalOutputQty : 0;

    // 4️⃣ Generate batch number
    const batchCount = await db
      .collection("production_batches")
      .countDocuments();

    const batchNo = `PB-${String(batchCount + 1).padStart(4, "0")}`;

    // 5️⃣ Create production batch with costing
    await db.collection("production_batches").insertOne({
      batchNo,
      status: "in_progress",
      rawMaterials,
      finishedProducts: finishedProducts || [],
      totalRawCost,
      totalOutputQty,
      costPerUnit,
      startedAt: date ? new Date(date) : new Date(),
      completedAt: null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      batchNo,
      totalRawCost,
      costPerUnit,
    });
  } catch (error) {
    console.error("Production start error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}