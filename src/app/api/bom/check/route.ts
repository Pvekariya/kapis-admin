import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/* POST /api/bom/check
   Body: { items: [{ productId, qty }] }
   Returns per-item: available stock, can produce more, raw shortages
*/
export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const { items } = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const db      = await getDb();
  const results = [];

  for (const item of items) {
    if (!item.productId) continue;

    let pid: ObjectId;
    try { pid = new ObjectId(item.productId); } catch { continue; }

    const requested = Number(item.qty ?? 1);

    /* Finished product stock */
    const product = await db.collection("inventory").findOne({ _id: pid });
    if (!product) continue;

    const available    = Number(product.stock ?? 0);
    const shortage     = Math.max(0, requested - available);
    const canFulfill   = available >= requested;

    /* Check BOM for this product */
    const bom = await db.collection("bom").findOne({ finishedProductId: pid });

    let canProduceUnits = 0;
    let rawShortages: any[] = [];
    let hasBom = false;

    if (bom && bom.items?.length > 0) {
      hasBom = true;
      let maxFromRaw = Infinity;

      for (const bomItem of bom.items) {
        const raw = await db.collection("inventory").findOne({
          _id: bomItem.rawProductId,
        });

        const rawAvailable  = Number(raw?.stock ?? 0);
        const rawNeeded     = bomItem.qtyPerUnit;
        const canMakeFromThis = Math.floor(rawAvailable / rawNeeded);

        maxFromRaw = Math.min(maxFromRaw, canMakeFromThis);

        const totalRawNeeded = bomItem.qtyPerUnit * shortage;
        if (rawAvailable < totalRawNeeded) {
          rawShortages.push({
            rawProductId:  bomItem.rawProductId.toString(),
            name:          raw?.name ?? "Unknown",
            have:          rawAvailable,
            need:          totalRawNeeded,
            short:         totalRawNeeded - rawAvailable,
            qtyPerUnit:    bomItem.qtyPerUnit,
          });
        }
      }

      canProduceUnits = maxFromRaw === Infinity ? 0 : maxFromRaw;
    }

    results.push({
      productId:      item.productId,
      productName:    product.name,
      requested,
      available,
      shortage,
      canFulfill,
      hasBom,
      canProduceUnits,    // how many MORE units can be produced right now
      rawShortages,        // which raw materials are short
      canAutoProduceFull:  hasBom && rawShortages.length === 0 && shortage > 0,
      // true = can auto-create production batch to fulfil the shortage
    });
  }

  return NextResponse.json(results);
}