

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const batches = await db
      .collection("production_batches")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Production list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}