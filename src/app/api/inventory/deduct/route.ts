import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function normalizeId(id: any) {
  if (!id) return null;

  try {
    return typeof id === "string" ? new ObjectId(id) : id;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const invoiceItems: any[] = [];
  let hasPending = false;

  for (const i of body.items) {

    const pid = normalizeId(i.productId);
    if (!pid) continue;

    const product = await db.collection("inventory").findOne({
      _id: pid,
    });

    if (!product) {
      console.log("❌ PRODUCT NOT FOUND:", i.productId);
      continue;
    }

    const available = Number(product.stock || 0);
    const requested = Number(i.qty || 0);

    let fulfilled = 0;
    let pending = 0;

    if (available >= requested) {
      fulfilled = requested;

      await db.collection("inventory").updateOne(
        { _id: product._id },
        { $inc: { stock: -requested } }
      );

    } else if (available > 0) {
      fulfilled = available;
      pending = requested - available;
      hasPending = true;

      await db.collection("inventory").updateOne(
        { _id: product._id },
        { $set: { stock: 0 } }
      );

      await db.collection("orders").insertOne({
        invoice: body.invoice,
        buyer: body.customer || "Inventory",
        source: "bill",
        productId: product._id,
        name: product.name,
        color: product.color || "",
        qty: pending,
        status: "pending",
        createdAt: new Date(),
      });

    } else {
      pending = requested;
      hasPending = true;

      await db.collection("orders").insertOne({
        invoice: body.invoice,
        buyer: body.customer || "Inventory",
        source: "bill",
        productId: product._id,
        name: product.name,
        color: product.color || "",
        qty: pending,
        status: "pending",
        createdAt: new Date(),
      });
    }

    invoiceItems.push({
      productId: product._id,
      name: product.name,
      qty: requested,
      fulfilled,
      pending,
      price: product.price,
      total: requested * product.price,
    });
  }

  await db.collection("sales").insertOne({
    invoice: body.invoice,
    customer: body.customer,
    address: body.address,
    items: invoiceItems,
    subtotal: body.subtotal,
    gst: body.gst,
    total: body.total,
    hasPending,
    date: new Date(),
  });

  return NextResponse.json({
    success: true,
    pending: hasPending,
  });
}