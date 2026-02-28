import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/*
STATUS FLOW
pending → ready → done

ready/done = stock adjustment happens
done = remove order
*/

export async function GET() {
  const db = await getDb();
  const raw = await db.collection("orders").find().toArray();

  const orders = raw.map((o: any) => ({
    ...o,
    color: o.color || "",
  }));
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  // buyer comes from bill OR inventory
  await db.collection("orders").insertOne({
    buyer: body.buyer || "inventory",
    productId: new ObjectId(body.productId),
    name: body.name,
    color: body.color || "",
    qty: Number(body.qty),
    status: "pending",
    priority: body.priority || "normal",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const order = await db.collection("orders").findOne({
    _id: new ObjectId(body.id),
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" });
  }

  const product = await db.collection("inventory").findOne({
    _id: new ObjectId(order.productId),
  });

  if (!product) {
    return NextResponse.json({ error: "Product missing" });
  }

  const currentStock = product.stock;
  const orderQty = order.qty;

  // 🔥 when marking READY or DONE
  if (body.status === "ready" || body.status === "done") {

    // deduct required
    if (currentStock >= orderQty) {
      await db.collection("inventory").updateOne(
        { _id: product._id },
        { $inc: { stock: -orderQty } }
      );
    } else {
      // partial
      const remaining = orderQty - currentStock;

      await db.collection("inventory").updateOne(
        { _id: product._id },
        { $set: { stock: 0 } }
      );

      // reinsert remaining as new order
      await db.collection("orders").insertOne({
        buyer: order.buyer,
        productId: order.productId,
        name: order.name,
        color: order.color || "",
        qty: remaining,
        status: "pending",
        priority: order.priority,
        createdAt: new Date(),
      });
    }
  }

  // DONE = create income entry + remove order
  if (body.status === "done") {

    // 🔥 create daybook income entry
    await db.collection("daybook").insertOne({
      type: "income",
      category: "sale",
      referenceId: order._id,
      description: `Sale - ${order.name}`,
      amount: Number(order.qty) * Number(product.price || 0),
      paymentMode: "cash", // adjust later if you add payment mode in orders
      date: new Date(),
      createdAt: new Date(),
    });

    await db.collection("orders").deleteOne({
      _id: order._id,
    });

  } else {

    await db.collection("orders").updateOne(
      { _id: order._id },
      { $set: { status: body.status } }
    );

  }

  return NextResponse.json({ success: true });
}