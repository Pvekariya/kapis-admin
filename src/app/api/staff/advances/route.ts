import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";

/* =========================
   GET ADVANCES (MONTH FILTER)
========================= */
export async function GET(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const { searchParams } = new URL(req.url);

  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const staffId = searchParams.get("staffId");

  const filter: any = {};

  if (!isNaN(month)) filter.month = month;
  if (!isNaN(year)) filter.year = year;
  if (staffId) filter.staffId = new ObjectId(staffId);

  const advances = await db
    .collection("advances")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(advances);
}


/* =========================
   ADD ADVANCE
========================= */
export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const body = await req.json();

  const { staffId, amount, reason, month, year, paymentMode } = body;

  if (!staffId || !amount || !month || !year) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const staff = await db.collection("staff").findOne({
    _id: new ObjectId(staffId),
  });

  const staffName = staff?.name || "Unknown Staff";

  const result = await db.collection("advances").insertOne({
    staffId: new ObjectId(staffId),
    staffName,
    amount: Number(amount),
    reason: reason || "",
    paymentMode: paymentMode || "Cash",
    month: Number(month),
    year: Number(year),
    date: new Date(),
    createdAt: new Date(),
  });

  // Push to Daybook as expense
  await db.collection("daybook").insertOne({
    type: "expense",
    category: "Staff Advance",
    amount: Number(amount),
    description: `${staffName} - Advance`,
    paymentMode: paymentMode || "Cash",
    referenceId: result.insertedId.toString(),
    source: "advance",
    date: new Date(),
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}


/* =========================
   DELETE ADVANCE
========================= */
export async function DELETE(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  await db.collection("advances").deleteOne({
    _id: new ObjectId(id),
  });

  // Also remove related Daybook entry
  await db.collection("daybook").deleteMany({
    referenceId: id,
    source: "advance",
  });

  return NextResponse.json({ success: true });
}
