import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const start = new Date();
  const day = start.getDay(); // 0=Sun
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(start.setDate(diff));
  monday.setHours(0,0,0,0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);

  const data = await db.collection("sales").aggregate([

    { $match: { date: { $gte: monday, $lte: sunday } } },

    { $unwind: "$items" },

    {
      $group: {
        _id: {
          day: { $dayOfWeek: "$date" },
          product: "$items.name"
        },
        revenue: { $sum: "$items.total" }
      }
    }

  ]).toArray();

  return NextResponse.json(data);
}