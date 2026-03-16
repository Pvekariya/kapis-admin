import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";

const MONTH_CODES: Record<number, string> = {
  0: "A", 1: "B", 2: "C", 3: "D",
  4: "E", 5: "F", 6: "G", 7: "H",
  8: "I", 9: "J", 10: "K", 11: "L",
};

export async function GET(request: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const customDate = searchParams.get("customDate");

  const baseDate = customDate
    ? new Date(customDate + "T00:00:00")
    : new Date();

  const prefix = MONTH_CODES[baseDate.getMonth()];
  const db = await getDb();

  // Atomic increment counter — prevents race condition duplicate invoices
  const counter = await db.collection("invoiceCounters").findOneAndUpdate(
    { id: prefix },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  const seq = counter?.seq ?? 1;
  const formatted = `${prefix}${String(seq).padStart(3, "0")}`;

  return NextResponse.json({ invoice: formatted });
}