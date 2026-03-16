import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "ready", "done"]),
});

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const orders = await db.collection("orders").find().toArray();
  return NextResponse.json(orders.map((o: any) => ({ ...o, color: o.color ?? "" })));
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  if (!body.productId || !body.qty)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = await getDb();
  await db.collection("orders").insertOne({
    buyer: body.buyer ?? "inventory",
    productId: new ObjectId(body.productId),
    name: String(body.name ?? ""),
    color: String(body.color ?? ""),
    qty: Number(body.qty),
    status: "pending",
    priority: body.priority ?? "normal",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, status } = parsed.data;
  const db = await getDb();

  const order = await db
    .collection("orders")
    .findOne({ _id: new ObjectId(id) });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const product = await db
    .collection("inventory")
    .findOne({ _id: new ObjectId(order.productId) });
  if (!product)
    return NextResponse.json({ error: "Product missing" }, { status: 404 });

  if (status === "ready" || status === "done") {
    const qty = Number(order.qty);
    const stock = Number(product.stock ?? 0);

    if (stock >= qty) {
      await db
        .collection("inventory")
        .updateOne({ _id: product._id }, { $inc: { stock: -qty } });
    } else {
      await db
        .collection("inventory")
        .updateOne({ _id: product._id }, { $set: { stock: 0 } });
      if (stock < qty) {
        await db.collection("orders").insertOne({
          buyer: order.buyer, productId: order.productId,
          name: order.name, color: order.color ?? "",
          qty: qty - stock, status: "pending",
          priority: order.priority, createdAt: new Date(),
        });
      }
    }
  }

  if (status === "done") {
    await db.collection("daybook").insertOne({
      type: "income", category: "sale",
      referenceId: order._id,
      description: `Sale - ${order.name}`,
      amount: Number(order.qty) * Number(product.price ?? 0),
      paymentMode: "cash",
      date: new Date(), createdAt: new Date(),
    });
    await db.collection("orders").deleteOne({ _id: order._id });
  } else {
    await db
      .collection("orders")
      .updateOne({ _id: order._id }, { $set: { status } });
  }

  return NextResponse.json({ success: true });
}