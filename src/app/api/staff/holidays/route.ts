import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const { searchParams } = new URL(req.url);

  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "Invalid month/year" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const holidays = await db.collection("holidays").find({
    date: { $gte: start, $lte: end },
  }).toArray();

  return NextResponse.json(holidays);
}
