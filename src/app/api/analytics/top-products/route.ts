import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const data = await db.collection("sales").aggregate([

    { $unwind: "$items" },

    {
      $group: {
        _id: "$items.name",
        total: { $sum: "$items.total" }
      }
    }

  ]).toArray();

  return NextResponse.json(
    data.map(d => ({
      name: d._id,
      value: d.total / 1000 // convert to K
    }))
  );
}