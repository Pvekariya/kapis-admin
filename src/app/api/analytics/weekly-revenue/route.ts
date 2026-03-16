// src/app/api/analytics/weekly-revenue/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const data = await db.collection("sales").aggregate([
    { $match: { date: { $gte: monday, $lte: sunday } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: { day: { $dayOfWeek: "$date" }, product: "$items.name" },
        revenue: { $sum: "$items.total" },
      },
    },
  ]).toArray();

  return NextResponse.json(data);
}