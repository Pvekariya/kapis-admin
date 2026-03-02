import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const db = await getDb();

  const { searchParams } = new URL(request.url);
  const customDate = searchParams.get("customDate");

  const monthCodes: Record<number, string> = {
    0: "A",  // Jan
    1: "B",  // Feb
    2: "C",  // Mar
    3: "D",  // Apr
    4: "E",  // May
    5: "F",  // Jun
    6: "G",  // Jul
    7: "H",  // Aug
    8: "I",  // Sept
    9: "J",  // Oct
    10: "K", // Nov
    11: "L", // Dec
  };

  const baseDate = customDate
    ? new Date(customDate + "T00:00:00")
    : new Date();

  const currentMonth = baseDate.getMonth();
  const prefix = monthCodes[currentMonth];

  // Find last invoice of this month only
  const last = await db
    .collection("sales")
    .find({ invoice: { $regex: `^${prefix}` } })
    .sort({ invoice: -1 })
    .limit(1)
    .toArray();

  let nextNumber = 1;

  if (last.length > 0) {
    const lastInvoice = last[0].invoice; // e.g. A005
    const numericPart = parseInt(lastInvoice.substring(1));
    if (!isNaN(numericPart)) {
      nextNumber = numericPart + 1;
    }
  }

  const formatted = `${prefix}${String(nextNumber).padStart(3, "0")}`;

  return NextResponse.json({ invoice: formatted });
}
