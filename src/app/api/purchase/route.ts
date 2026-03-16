import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const PurchaseSchema = z.object({
  invoice: z.string().min(1).max(50),
  supplier: z.string().min(1).max(200),
  paymentMode: z.enum(["cash", "upi", "bank"]).default("cash"),
  productType: z.enum(["raw", "finished"]).default("raw"),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().max(200).optional(),
    qty: z.number().positive(),
    price: z.number().min(0),
  })).min(1),
});

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PurchaseSchema.safeParse({
    ...body,
    items: (body.items ?? []).map((i: any) => ({
      ...i,
      qty: Number(i.qty),
      price: Number(i.price),
    })),
  });

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { invoice, supplier, paymentMode, productType, items } = parsed.data;
  const db = await getDb();
  const purchaseItems: any[] = [];

  for (const item of items) {
    let product: any = null;

    if (item.productId) {
      try {
        product = await db.collection("inventory").findOne({
          _id: new ObjectId(item.productId),
          type: productType,
        });
      } catch {}
    }

    if (!product && item.productName) {
      product = await db.collection("inventory").findOne({
        name: item.productName,
        type: productType,
      });
    }

    if (product) {
      await db.collection("inventory").updateOne(
        { _id: product._id },
        { $inc: { stock: item.qty } }
      );
    } else if (item.productName) {
      const res = await db.collection("inventory").insertOne({
        name: item.productName,
        stock: item.qty,
        price: item.price,
        costPrice: item.price,
        type: productType,
        color: "", hsn: "", packing: "",
        createdAt: new Date(),
      });
      product = { _id: res.insertedId, name: item.productName };
    }

    if (!product) continue;

    purchaseItems.push({
      productId: product._id,
      name: product.name,
      qty: item.qty,
      price: item.price,
      total: item.qty * item.price,
    });
  }

  if (!purchaseItems.length)
    return NextResponse.json({ error: "No valid items" }, { status: 400 });

  const total = purchaseItems.reduce((s, i) => s + i.total, 0);

  const result = await db.collection("purchase").insertOne({
    invoice, supplier, items: purchaseItems, total,
    paymentMode, productType,
    date: new Date(), createdAt: new Date(),
  });

  await db.collection("daybook").insertOne({
    type: "expense",
    category: "purchase",
    referenceId: result.insertedId,
    description: `Purchase Invoice #${invoice} - ${supplier}`,
    amount: total,
    paymentMode,
    date: new Date(), createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}