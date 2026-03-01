import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper to parse query params from URL
function parseQueryParams(url: string) {
  const u = new URL(url, "http://localhost"); // base required for relative URLs
  const params: Record<string, string | undefined> = {};
  for (const key of ["from", "to", "type", "paymentMode", "category"]) {
    const value = u.searchParams.get(key);
    if (value) params[key] = value;
  }
  return params;
}

/* =========================
   GET ALL DAYBOOK ENTRIES WITH FILTERS & SUMMARY
========================= */
export async function GET(req: Request) {
  const db = await getDb();
  const params = parseQueryParams(req.url || "");

  // Build filter
  const filter: any = {};
  if (params.from || params.to) {
    filter.date = {};

    if (params.from) {
      const fromDate = new Date(params.from);
      fromDate.setHours(0, 0, 0, 0);
      filter.date.$gte = fromDate;
    }

    if (params.to) {
      const toDate = new Date(params.to);
      toDate.setHours(23, 59, 59, 999);
      filter.date.$lte = toDate;
    }
  }
  if (params.type) filter.type = params.type;
  if (params.paymentMode) filter.paymentMode = params.paymentMode;
  if (params.category) filter.category = params.category;

  const entries = await db
    .collection("daybook")
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  // Calculate financial summary
  let totalIncome = 0;
  let totalExpense = 0;
  let cashBalance = 0;
  let bankBalance = 0;
  for (const entry of entries) {
    const amt = Number(entry.amount) || 0;
    if (entry.type === "income") {
      totalIncome += amt;
      if (entry.paymentMode === "cash") cashBalance += amt;
      if (["bank", "upi"].includes(entry.paymentMode)) bankBalance += amt;
    }
    if (entry.type === "expense") {
      totalExpense += amt;
      if (entry.paymentMode === "cash") cashBalance -= amt;
      if (["bank", "upi"].includes(entry.paymentMode)) bankBalance -= amt;
    }
  }
  const netBalance = totalIncome - totalExpense;

  const summary = {
    totalIncome,
    totalExpense,
    netBalance,
    cashBalance,
    bankBalance,
  };

  return NextResponse.json({ entries, summary });
}

/* =========================
   CREATE DAYBOOK ENTRY
========================= */
export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  if (!body.amount || Number(body.amount) <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid amount" },
      { status: 400 }
    );
  }

  const entry = {
    type: body.type,
    category: body.category,
    referenceId: body.referenceId || null,
    description: body.description ? String(body.description).trim() : "",
    amount: Number(body.amount),
    paymentMode: body.paymentMode,
    date: body.date ? new Date(body.date) : new Date(),
    createdAt: new Date(),
  };

  const result = await db.collection("daybook").insertOne(entry);

  return NextResponse.json({
    success: true,
    insertedId: result.insertedId,
    entry,
  });
}

/* =========================
   DELETE DAYBOOK ENTRY
========================= */
export async function DELETE(req: Request) {
  const db = await getDb();
  const { id } = await req.json();

  await db.collection("daybook").deleteOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({ success: true });
}