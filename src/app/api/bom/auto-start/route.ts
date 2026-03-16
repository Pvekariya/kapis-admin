import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/* POST /api/production/auto-start
   Body: { finishedProductId, qtyNeeded, invoiceRef? }
   Creates a production batch using the BOM, deducts raw materials
*/
export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const { finishedProductId, qtyNeeded, invoiceRef } = await req.json();

  if (!finishedProductId || !qtyNeeded)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  let fid: ObjectId;
  try { fid = new ObjectId(finishedProductId); }
  catch { return NextResponse.json({ error: "Invalid productId" }, { status: 400 }); }

  const db  = await getDb();
  const qty = Number(qtyNeeded);

  /* 1 — Find finished product */
  const finishedProduct = await db.collection("inventory").findOne({ _id: fid });
  if (!finishedProduct)
    return NextResponse.json({ error: "Finished product not found" }, { status: 404 });

  /* 2 — Find BOM */
  const bom = await db.collection("bom").findOne({ finishedProductId: fid });
  if (!bom || !bom.items?.length)
    return NextResponse.json({ error: "No BOM defined for this product" }, { status: 400 });

  /* 3 — Validate all raw materials have enough stock */
  const shortages = [];
  let totalRawCost = 0;

  for (const bomItem of bom.items) {
    const raw          = await db.collection("inventory").findOne({ _id: bomItem.rawProductId });
    const needed       = bomItem.qtyPerUnit * qty;
    const available    = Number(raw?.stock ?? 0);

    if (available < needed) {
      shortages.push({
        name:      raw?.name ?? "Unknown",
        needed,
        available,
        short:     needed - available,
      });
    }

    totalRawCost += (Number(raw?.price ?? 0)) * needed;
  }

  if (shortages.length > 0) {
    /* Add low-raw-material notifications */
    for (const s of shortages) {
      await db.collection("notifications").insertOne({
        message:   `⚠ Low raw material: "${s.name}" — need ${s.needed}, have ${s.available} (short by ${s.short})`,
        type:      "raw_shortage",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success:  false,
      error:    "Insufficient raw materials",
      shortages,
    }, { status: 400 });
  }

  /* 4 — Deduct raw materials */
  for (const bomItem of bom.items) {
    const needed = bomItem.qtyPerUnit * qty;
    await db.collection("inventory").updateOne(
      { _id: bomItem.rawProductId },
      { $inc: { stock: -needed } }
    );
  }

  /* 5 — Generate batch number */
  const batchCount = await db.collection("production_batches").countDocuments();
  const batchNo    = `AUTO-${String(batchCount + 1).padStart(4, "0")}`;
  const costPerUnit = qty > 0 ? totalRawCost / qty : 0;

  /* 6 — Create production batch */
  const result = await db.collection("production_batches").insertOne({
    batchNo,
    status:            "in_progress",
    source:            "auto",                // triggered from billing
    invoiceRef:        invoiceRef ?? null,
    finishedProductId: fid,
    rawMaterials:      bom.items.map((i: any) => ({
      productId: i.rawProductId,
      quantity:  i.qtyPerUnit * qty,
    })),
    finishedProducts: [{
      productId: fid,
      quantity:  qty,
    }],
    totalRawCost,
    totalOutputQty: qty,
    costPerUnit,
    startedAt:  new Date(),
    completedAt: null,
    createdAt:  new Date(),
  });

  /* 7 — Notify */
  await db.collection("notifications").insertOne({
    message:   `Auto production batch ${batchNo} started — ${qty}x ${finishedProduct.name}`,
    type:      "production",
    createdAt: new Date(),
  });

  return NextResponse.json({
    success:  true,
    batchId:  result.insertedId.toString(),
    batchNo,
    totalRawCost,
    costPerUnit,
  });
}