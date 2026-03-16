import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const DeductSchema = z.object({
  invoice:     z.string().min(1).max(50),
  customer:    z.string().max(200).optional().default("Walk-in"),
  address:     z.string().max(500).optional().default(""),
  note:        z.string().max(500).optional().default(""),
  paymentMode: z.enum(["cash","upi","bank"]).optional().default("cash"),
  cgst:        z.number().min(0).max(50).optional().default(0),
  sgst:        z.number().min(0).max(50).optional().default(0),
  igst:        z.number().min(0).max(50).optional().default(0),
  paid:        z.number().min(0).optional().default(0),
  paidDate:    z.string().optional().default(""),
  items: z.array(z.object({
    productId: z.string().min(1),
    qty:       z.number().min(1),
  })).min(1),
});

function toOid(id: any): ObjectId | null {
  try { return new ObjectId(id); } catch { return null; }
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body   = await req.json();
  const parsed = DeductSchema.safeParse({
    ...body,
    cgst:  Number(body.cgst  ?? 0),
    sgst:  Number(body.sgst  ?? 0),
    igst:  Number(body.igst  ?? 0),
    paid:  Number(body.paid  ?? 0),
    items: (body.items ?? []).map((i: any) => ({
      productId: i.productId,
      qty:       Number(i.qty ?? 0),
    })),
  });

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;
  const db   = await getDb();

  // Duplicate invoice check
  const existing = await db.collection("sales").findOne({ invoice: data.invoice });
  if (existing)
    return NextResponse.json(
      { success: false, message: "Invoice already exists" },
      { status: 400 }
    );

  const invoiceItems: any[] = [];
  let hasPending    = false;
  let serverSubtotal = 0;

  for (const item of data.items) {
    const pid = toOid(item.productId);
    if (!pid) continue;

    const product = await db.collection("inventory").findOne({ _id: pid });
    if (!product) continue;

    const available = Number(product.stock ?? 0);
    const requested = item.qty;
    const unitPrice = Number(product.price ?? 0);
    let fulfilled = 0;
    let pending   = 0;

    if (available >= requested) {
      fulfilled = requested;
      await db.collection("inventory").updateOne({ _id: product._id }, { $inc: { stock: -requested } });
    } else if (available > 0) {
      fulfilled  = available;
      pending    = requested - available;
      hasPending = true;
      await db.collection("inventory").updateOne({ _id: product._id }, { $set: { stock: 0 } });
      await db.collection("orders").insertOne({ invoice: data.invoice, buyer: data.customer, source: "bill", productId: product._id, name: product.name, color: product.color ?? "", qty: pending, status: "pending", createdAt: new Date() });
    } else {
      pending    = requested;
      hasPending = true;
      await db.collection("orders").insertOne({ invoice: data.invoice, buyer: data.customer, source: "bill", productId: product._id, name: product.name, color: product.color ?? "", qty: pending, status: "pending", createdAt: new Date() });
    }

    const lineTotal  = requested * unitPrice;
    serverSubtotal  += lineTotal;
    invoiceItems.push({ productId: product._id, name: product.name, qty: requested, fulfilled, pending, price: unitPrice, total: lineTotal });
  }

  const gstRate     = data.cgst + data.sgst + data.igst;
  const serverGst   = serverSubtotal * (gstRate / 100);
  const serverTotal = serverSubtotal + serverGst;
  const due         = serverTotal - data.paid;

  await db.collection("sales").insertOne({
    invoice: data.invoice, customer: data.customer, address: data.address,
    note: data.note, items: invoiceItems, subtotal: serverSubtotal,
    gst: serverGst, total: serverTotal, paid: data.paid, paidDate: data.paidDate,
    due, hasPending, paymentMode: data.paymentMode,
    date: new Date(), createdAt: new Date(),
  });

  const now = new Date();

  /* Paid portion → income */
  if (data.paid > 0) {
    await db.collection("daybook").insertOne({
      type: "income", category: "sale",
      description: `Invoice #${data.invoice} — ${data.customer} (Paid)`,
      amount: data.paid, paymentMode: data.paymentMode,
      invoiceRef: data.invoice,
      date: now, createdAt: now,
    });
  }

  /* Due portion → separate due entry with unpaid status */
  if (due > 0) {
    await db.collection("daybook").insertOne({
      type: "due", category: "sale",
      description: `Invoice #${data.invoice} — ${data.customer} (Due)`,
      amount: due, paymentMode: "pending",
      invoiceRef: data.invoice, customer: data.customer,
      status: "unpaid",
      date: now, createdAt: now,
    });
  }

  /* Full cash with no split → single income entry */
  if (data.paid === 0 && due <= 0 && serverTotal > 0) {
    await db.collection("daybook").insertOne({
      type: "income", category: "sale",
      description: `Invoice #${data.invoice} — ${data.customer}`,
      amount: serverTotal, paymentMode: data.paymentMode,
      invoiceRef: data.invoice,
      date: now, createdAt: now,
    });
  }

  await db.collection("notifications").insertOne({
    message: `New sale: Invoice #${data.invoice} — ₹${Math.round(serverTotal).toLocaleString("en-IN")}`,
    type: "sale", createdAt: now,
  });

  return NextResponse.json({ success: true, pending: hasPending, total: serverTotal });
}