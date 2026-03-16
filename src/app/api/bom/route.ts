import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const BomSchema = z.object({
  finishedProductId: z.string().min(1),
  items: z.array(z.object({
    rawProductId:  z.string().min(1),
    qtyPerUnit:    z.number().positive(),
  })).min(1),
});

/* GET /api/bom — all BOMs, or ?finishedProductId=xxx */
export async function GET(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db  = await getDb();
  const url = new URL(req.url);
  const fid = url.searchParams.get("finishedProductId");

  const filter = fid ? { finishedProductId: new ObjectId(fid) } : {};
  const boms   = await db.collection("bom").find(filter).toArray();

  return NextResponse.json(boms);
}

/* POST /api/bom — create or replace BOM for a finished product */
export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body   = await req.json();
  const parsed = BomSchema.safeParse({
    ...body,
    items: (body.items ?? []).map((i: any) => ({
      rawProductId: i.rawProductId,
      qtyPerUnit:   Number(i.qtyPerUnit),
    })),
  });

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db  = await getDb();
  const fid = new ObjectId(parsed.data.finishedProductId);

  // Upsert — one BOM per finished product
  await db.collection("bom").updateOne(
    { finishedProductId: fid },
    {
      $set: {
        finishedProductId: fid,
        items: parsed.data.items.map(i => ({
          rawProductId: new ObjectId(i.rawProductId),
          qtyPerUnit:   i.qtyPerUnit,
        })),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

/* DELETE /api/bom?finishedProductId=xxx */
export async function DELETE(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const url = new URL(req.url);
  const fid = url.searchParams.get("finishedProductId");
  if (!fid) return NextResponse.json({ error: "Missing finishedProductId" }, { status: 400 });

  const db = await getDb();
  await db.collection("bom").deleteOne({ finishedProductId: new ObjectId(fid) });

  return NextResponse.json({ success: true });
}