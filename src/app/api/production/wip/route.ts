import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const batches = await db
      .collection("production_batches")
      .find({ status: "in_progress" })
      .sort({ startedAt: -1 })
      .toArray();

    let totalRawCost = 0;
    let totalOutputQty = 0;

    batches.forEach((b) => {
      totalRawCost += Number(b.totalRawCost) || 0;
      totalOutputQty += Number(b.totalOutputQty) || 0;
    });

    const avgCostPerUnit =
      totalOutputQty > 0 ? totalRawCost / totalOutputQty : 0;

    return NextResponse.json({
      batches,
      summary: {
        activeCount: batches.length,
        totalRawCost,
        totalOutputQty,
        avgCostPerUnit,
      },
    });
  } catch (error) {
    console.error("WIP fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch WIP data" },
      { status: 500 }
    );
  }
}