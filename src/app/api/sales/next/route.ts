import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const last = await db
    .collection("sales")
    .find()
    .sort({ invoice: -1 })
    .limit(1)
    .toArray();

  const next = last.length
    ? String(Number(last[0].invoice) + 1).padStart(3, "0")
    : "001";

  return NextResponse.json({ invoice: next });
}
