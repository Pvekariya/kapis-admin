import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const UpdateSchema = z.object({
  id: z.string().min(1),
  update: z.object({
    invoice: z.string().max(50).optional(),
    customer: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    date: z.string().optional(),
    gstRate: z.number().min(0).max(100).optional(),
    paid: z.number().min(0).optional(),
    items: z.array(z.object({
      productId: z.string().optional(),
      name: z.string().max(200),
      qty: z.number().min(0),
      price: z.number().min(0),
    })).optional(),
  }),
});

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, update } = parsed.data;
  const db = await getDb();

  const oldDoc = await db
    .collection("sales")
    .findOne({ _id: new ObjectId(id) });
  if (!oldDoc)
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const items = (update.items ?? oldDoc.items ?? []).map((item: any) => ({
    ...item,
    qty: Number(item.qty ?? 0),
    price: Number(item.price ?? 0),
    total: Number(item.qty ?? 0) * Number(item.price ?? 0),
  }));

  const subtotal = items.reduce((s: number, i: any) => s + i.total, 0);
  const gstRate = update.gstRate ?? 12;
  const gst = Math.round(subtotal * (gstRate / 100));
  const total = subtotal + gst;

  // Inventory delta adjustment
  const inventoryCol = db.collection("inventory");
  const oldMap: Record<string, number> = {};
  const newMap: Record<string, number> = {};

  (oldDoc.items ?? []).forEach((i: any) => {
    if (i.productId)
      oldMap[i.productId.toString()] =
        (oldMap[i.productId.toString()] ?? 0) + Number(i.qty ?? 0);
  });

  items.forEach((i: any) => {
    if (i.productId)
      newMap[i.productId.toString()] =
        (newMap[i.productId.toString()] ?? 0) + Number(i.qty ?? 0);
  });

  const allIds = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
  for (const pid of allIds) {
    const diff = (newMap[pid] ?? 0) - (oldMap[pid] ?? 0);
    if (diff !== 0) {
      try {
        await inventoryCol.updateOne(
          { _id: new ObjectId(pid) },
          { $inc: { stock: -diff } }
        );
      } catch {}
    }
  }

  await db.collection("sales").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        invoice: update.invoice ?? oldDoc.invoice,
        customer: update.customer ?? oldDoc.customer,
        address: update.address ?? oldDoc.address,
        date: update.date ? new Date(update.date) : oldDoc.date,
        items,
        subtotal,
        gst,
        total,
        paid: update.paid ?? oldDoc.paid ?? 0,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ success: true });
}