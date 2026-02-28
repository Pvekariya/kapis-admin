import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/* =========================
   GET ALL SALES
========================= */
export async function GET() {
  const db = await getDb();

  const data = await db
    .collection("sales")
    .find({})
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(data);
}

/* =========================
   CREATE SALE + AUTO DAYBOOK ENTRY
========================= */
export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const saleData = {
    billNo: body.billNo,
    customerName: body.customerName || "Walk-in Customer",
    items: body.items || [],
    totalAmount: Number(body.totalAmount),
    paymentMode: body.paymentMode || "cash",
    date: body.date ? new Date(body.date) : new Date(),
    createdAt: new Date(),
  };

  const result = await db.collection("sales").insertOne(saleData);

  // 🔥 AUTO INSERT INTO DAYBOOK
  await db.collection("daybook").insertOne({
    type: "income",
    category: "sale",
    referenceId: result.insertedId,
    description: `Sale Bill #${saleData.billNo}`,
    amount: saleData.totalAmount,
    paymentMode: saleData.paymentMode,
    date: saleData.date,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}