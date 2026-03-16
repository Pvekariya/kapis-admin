import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const EntrySchema = z.object({
  type:        z.enum(["income","expense","due"]),
  category:    z.string().max(100),
  description: z.string().min(1).max(500),
  amount:      z.number().positive(),
  paymentMode: z.string().max(50),
  date:        z.string().optional(),
});

function parseParams(url: string) {
  const u = new URL(url, "http://localhost");
  return {
    from:        u.searchParams.get("from")        ?? "",
    to:          u.searchParams.get("to")          ?? "",
    type:        u.searchParams.get("type")        ?? "",
    paymentMode: u.searchParams.get("paymentMode") ?? "",
    category:    u.searchParams.get("category")    ?? "",
  };
}

export async function GET(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const p  = parseParams(req.url);
  const filter: any = {};

  if (p.from || p.to) {
    filter.date = {};
    if (p.from) { const d = new Date(p.from); d.setHours(0,0,0,0);    filter.date.$gte = d; }
    if (p.to)   { const d = new Date(p.to);   d.setHours(23,59,59,999); filter.date.$lte = d; }
  }
  if (p.type)        filter.type        = p.type;
  if (p.paymentMode) filter.paymentMode = p.paymentMode;
  if (p.category)    filter.category    = p.category;

  const entries = await db
    .collection("daybook")
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  // Summary counts only income & expense (not due)
  let totalIncome = 0, totalExpense = 0, cashBalance = 0, bankBalance = 0, totalDue = 0;

  for (const e of entries) {
    const amt  = Number(e.amount) || 0;
    const mode = (e.paymentMode ?? "").toLowerCase();

    if (e.type === "income") {
      totalIncome += amt;
      if (mode === "cash") cashBalance += amt;
      else                 bankBalance += amt;
    } else if (e.type === "expense") {
      totalExpense += amt;
      if (mode === "cash") cashBalance -= amt;
      else                 bankBalance -= amt;
    } else if (e.type === "due" && e.status === "unpaid") {
      totalDue += amt;
    }
  }

  return NextResponse.json({
    entries,
    summary: {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      cashBalance,
      bankBalance,
      totalDue,
    },
  });
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body   = await req.json();
  const parsed = EntrySchema.safeParse({ ...body, amount: Number(body.amount) });

  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db     = await getDb();
  const result = await db.collection("daybook").insertOne({
    ...parsed.data,
    date:      parsed.data.date ? new Date(parsed.data.date) : new Date(),
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, insertedId: result.insertedId });
}

export async function DELETE(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  await db.collection("daybook").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}

/* PATCH — mark a due entry as paid */
export async function PATCH(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const { id, paymentMode } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db    = await getDb();
  const entry = await db.collection("daybook").findOne({ _id: new ObjectId(id) });

  if (!entry)
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  if (entry.type !== "due")
    return NextResponse.json({ error: "Only due entries can be marked paid" }, { status: 400 });

  const now  = new Date();
  const mode = paymentMode || "cash";

  // Mark the due entry as paid
  await db.collection("daybook").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "paid", paidAt: now, paymentMode: mode } }
  );

  // Add a new income entry for the collected amount
  await db.collection("daybook").insertOne({
    type:        "income",
    category:    "sale",
    description: `${entry.description.replace("(Due)", "(Due Collected)")}`,
    amount:      entry.amount,
    paymentMode: mode,
    invoiceRef:  entry.invoiceRef ?? null,
    dueRef:      entry._id,
    date:        now,
    createdAt:   now,
  });

  return NextResponse.json({ success: true });
}