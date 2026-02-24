import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const data = await db.collection("inventory").aggregate([
    {
      $group: {
        _id: { name: "$name", color: "$color" },
        value: { $sum: "$stock" }
      }
    }
  ]).toArray();

  return NextResponse.json(
    data.map(d => ({
      name: `${d._id.name} (${d._id.color})`,
      value: d.value
    }))
  );
}