import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const count = await db.collection("orders").countDocuments();

  const sample = await db.collection("orders").findOne();

  return NextResponse.json({
    totalOrders: count,
    sample
  });
}